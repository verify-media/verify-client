import { Article, AssetNode, Content } from '../types/schema'
import { encryptAsset } from '../encryption/lit'
import {
  createArticleNode,
  createLicenseNode,
  getNode,
  publish,
  setUri
} from '../graph/protocol'
import {
  addEncryptionData,
  addIPFSData,
  addSignatureData,
  hashData,
  hashImage,
  signAssetNode,
  buildArticleBody,
  uploadToPinata
} from '.'
import { ensureHttps, ensureIPFS } from '../utils/app'
import path from 'path'
import { fetchFileFromPinata } from '../read'

const ZeroHash =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

const isOwned = (content: Content): boolean => content.ownership === 'owned'

//TODO maybe pass origin and BU separately
export const constructAssetNode = (
  content: Content,
  hash: string
): AssetNode => {
  if (content.type === 'text') {
    const asset: AssetNode = {
      data: {
        description: content.description,
        type: content.contentType,
        encrypted: true,
        access: {
          'lit-protocol': {
            version: 'v3'
          }
        },
        locations: [],
        manifest: {
          uri: ensureHttps(content.uri),
          title: content.title,
          alt: '',
          description: content.description,
          caption: '',
          creditedSource: content.authority.name,
          signingOrg: {
            name: content.authority.name,
            unit: content.authority.name
          },
          published: content.published
        },
        contentBinding: {
          algo: 'keccak256',
          hash: hash
        },
        history: []
      },
      signature: {
        curve: 'secp256k1',
        signature: '',
        message: '',
        description: ''
      }
    }

    return asset
  } else {
    if (!content.uri) throw new Error('content.uri is required')
    const url = new URL(content.uri)
    const filename = path.basename(url.pathname)
    const description = isOwned(content)
      ? `an image owned by ${content.authority.name}`
      : `an image licensed from ${content.licensedFrom}`
    const asset: AssetNode = {
      data: {
        description: description,
        type: content.contentType,
        encrypted: true,
        access: {
          'lit-protocol': {
            version: 'v3'
          }
        },
        locations: [],
        manifest: {
          uri: ensureHttps(content.uri),
          title: filename,
          alt: '',
          description: description,
          caption: '',
          creditedSource:
            (isOwned(content)
              ? content.authority.name
              : content.licensedFrom) || '',
          signingOrg: {
            name: content.authority.name,
            unit: content.authority.name
          },
          published: new Date().toISOString()
        },
        contentBinding: {
          algo: 'keccak256',
          hash: hash
        },
        history: []
      },
      signature: {
        curve: 'secp256k1',
        signature: '',
        message: '',
        description: ''
      }
    }

    return asset
  }
}

const breakArticleToAssets = async (article: Article): Promise<Content[]> => {
  //extract images
  const imageContentPromises = article.contents
    .filter((content: Content) => content.type === 'image')
    .map(async (_content: Content) => {
      const assetHash = await hashImage(_content.uri)

      return {
        title: _content.title,
        description: _content.description,
        uri: _content.uri,
        sourceId: _content.id,
        type: _content.type,
        creditedSource: _content.creditedSource,
        authority: _content.authority,
        contentType: _content.contentType,
        published: _content.published,
        encrypted: false,
        origin: article.metadata.origin,
        ownership: _content.ownership,
        licensedFrom: _content.licensedFrom,
        hash: assetHash
      }
    })

  const images = await Promise.all(imageContentPromises)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const content: Content[] = [...images]

  const _textContent = article.contents.filter(
    (content: Content) => content.type === 'text'
  )

  const _content = _textContent[0] as Content
  const mainBody = 'body' in _content ? _content.body || '' : ''
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const textAssetBody = buildArticleBody(article, mainBody, images)

  const textContent = {
    title: article.metadata.title || '',
    description: article.metadata.description,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    body: textAssetBody,
    uri: article.metadata.uri,
    sourceId: article.metadata.id,
    type: 'text',
    creditedSource: '',
    authority: article.metadata.authority,
    contentType: 'text/html',
    published: article.metadata.datePublished,
    encrypted: false,
    origin: article.metadata.origin,
    ownership: 'owned',
    licensedFrom: '',
    hash: ''
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  content.push(textContent)

  return content
}

const genAssetMetaHash = (assetNode: AssetNode): string => {
  const _assetNode = JSON.parse(JSON.stringify(assetNode))
  _assetNode.data.locations = []
  // since published date for non text assets is system date time which is different in every run
  // text assets are essentially publisher articles where publisher date is picked from the article itself
  if (_assetNode.data.type !== 'text/html') {
    _assetNode.data.manifest.published = ''
  }

  const hash = hashData(JSON.stringify(_assetNode.data))

  return hash
}

const genHash = (content: Content): string => {
  let assetHash = ''
  if (content.type === 'text') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { body: textBody } = content
    assetHash = hashData(textBody || '')
  } else {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    assetHash = content.hash
  }

  return assetHash
}

const checkAssetExists = async (
  assetHash: string,
  ipfsConfig: {
    pinataKey: string
    pinataSecret: string
  }
): Promise<{
  assetNode: AssetNode | null
  existingAssetMetaUri: string
  isAssetNew: boolean
}> => {
  let existingAssetMetaUri = ''
  let assetNode = null
  let isAssetNew = false
  try {
    const existingAssetNode = await getNode(assetHash)
    existingAssetMetaUri = ensureIPFS(existingAssetNode.uri)
    const assetMeta = (await fetchFileFromPinata(
      existingAssetMetaUri,
      'metadata',
      ipfsConfig
    )) as AssetNode
    assetNode = assetMeta
    isAssetNew = false
  } catch (error) {
    isAssetNew = true
    assetNode = null
  }

  return {
    assetNode,
    existingAssetMetaUri,
    isAssetNew
  }
}

const getAssetBlob = async (content: Content): Promise<Blob> => {
  if (content.type === 'text') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { body: textBody } = content
    const data = new Uint8Array(Buffer.from(textBody, 'utf-8'))
    const arrayBuffer = data.buffer

    return new Blob([arrayBuffer], { type: 'text/html' })
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blob = await fetch(content.uri).then((res: any) => res.blob())

    return blob
  }
}

/**
 * this is a workflow template function which takes an article and publishes it to the graph with a predefined hierarchy for the assets as per the ownership and licensing details
 * @param article article payload of type {@link Article}
 * @param ipfsConfig ipfs config object with pinataKey and pinataSecret {@link pinataConfig}
 * @param org on chain org node id and original material node id
 * @returns {Promise<{ assetHash: string, type: string }[]>} - array of asset hashes and types
 */
export const publishArticle = async (
  article: Article,
  ipfsConfig: {
    pinataKey: string
    pinataSecret: string
  },
  org: {
    orgNodeId: string
    ogNodeId: string
  }
): Promise<
  {
    assetHash: string
    type: string
  }[]
> => {
  const contents = await breakArticleToAssets(article)
  const results = []
  for (const content of contents) {
    let assetNode = null
    let chainAction = 'NOOP'
    const assetDetails = {
      id: '',
      uri: ''
    }
    // gen asset hash
    const assetHash = genHash(content)

    // check if asset exists on chain
    const {
      isAssetNew,
      existingAssetMetaUri,
      assetNode: _assetNode
    } = await checkAssetExists(assetHash, ipfsConfig)

    assetNode = _assetNode

    //if asset is new
    if (isAssetNew) {
      assetNode = constructAssetNode(content, assetHash)
      // encrypt asset
      const asset = await getAssetBlob(content)
      const encryptedAsset = await encryptAsset({
        content: asset as Blob,
        contentHash: assetHash
      })

      // add encryption data to assetNode
      assetNode = addEncryptionData(assetNode)

      // upload encrypted asset to IPFS
      const encoder = new TextEncoder()
      const encContent = encoder.encode(JSON.stringify(encryptedAsset))

      const assetLocation = await uploadToPinata({
        data: {
          name: assetHash,
          body: encContent
        },
        config: {
          pinataKey: ipfsConfig.pinataKey,
          pinataSecret: ipfsConfig.pinataSecret
        },
        type: 'asset'
      })

      if (!assetLocation?.IpfsHash)
        throw new Error('failed to upload asset to IPFS')

      // add encrypted asset location to assetNode
      assetNode = addIPFSData(assetNode, ensureIPFS(assetLocation.IpfsHash))

      // sign assetNode
      const signature = await signAssetNode(assetNode.data)
      assetNode = addSignatureData(assetNode, signature)

      // upload asset meta to IPFS
      const assetMetaLocation = await uploadToPinata({
        data: {
          name: assetNode.data.contentBinding.hash,
          body: assetNode
        },
        config: {
          pinataKey: ipfsConfig.pinataKey,
          pinataSecret: ipfsConfig.pinataSecret
        },
        type: 'meta'
      })

      if (!assetMetaLocation?.IpfsHash)
        throw new Error('failed to upload asset to IPFS')

      assetDetails.id = assetNode.data.contentBinding.hash
      assetDetails.uri = ensureIPFS(assetMetaLocation.IpfsHash)

      chainAction = 'PUBLISH'
    } else {
      // if asset exists on chain
      // get existing assetNode
      assetNode = _assetNode
      if (!assetNode)
        throw new Error('failed to construct asset node from onchain metadata')

      const prevAssetNode = assetNode

      // construct new assetNode
      let newAssetNode = constructAssetNode(content, assetHash)

      // check if asset metadata has changed
      if (genAssetMetaHash(prevAssetNode) === genAssetMetaHash(newAssetNode)) {
        chainAction = 'NOOP'
      } else {
        // populate new assetNode with actual asset details
        newAssetNode.data.locations = prevAssetNode.data.locations
        newAssetNode.data.access = prevAssetNode.data.access
        if (content.type !== 'text') {
          // update pub date since metadata changed // since pub date for all non text assets is system date
          newAssetNode.data.manifest.published = new Date().toISOString()
        }
        newAssetNode.data.history.push(ensureIPFS(existingAssetMetaUri))

        // sign assetNode
        const signature = await signAssetNode(newAssetNode.data)
        newAssetNode = addSignatureData(newAssetNode, signature)

        // upload asset meta to IPFS
        const assetMetaLocation = await uploadToPinata({
          data: {
            name: assetNode.data.contentBinding.hash,
            body: assetNode
          },
          config: {
            pinataKey: ipfsConfig.pinataKey,
            pinataSecret: ipfsConfig.pinataSecret
          },
          type: 'meta'
        })

        if (!assetMetaLocation?.IpfsHash)
          throw new Error('failed to upload asset to IPFS')

        assetDetails.id = assetNode.data.contentBinding.hash
        assetDetails.uri = ensureIPFS(assetMetaLocation.IpfsHash)

        if (
          content.ownership === 'owned' ||
          (content.ownership === 'licensed' &&
            content.licensedFrom &&
            content.licensedFrom.trim() !== '')
        ) {
          chainAction = content.type === 'text' ? 'PUBLISH' : 'SET_URI'
        }
      }
    }

    let parentId = ''

    // assets owned by publisher
    if (content.ownership === 'owned') {
      if (content.type === 'text') {
        // text node is an article node and hence gets published as
        // orgNode ==> originalMaterialNode ==> articleNode ==> articleAsset
        parentId = await createArticleNode(
          article.metadata.origin,
          article.metadata.id,
          org.ogNodeId
        )
      } else {
        // non text nodes are assets and hence get published as
        // orgNode ==> originalMaterialNode ==> assetNode
        parentId = org.ogNodeId
      }
    }

    // assets licensed from other publishers
    if (content.ownership === 'licensed') {
      if (!content.licensedFrom)
        throw new Error('content.licensedFrom is required')

      parentId = await createLicenseNode(content.licensedFrom, org.orgNodeId)
    }

    chainAction = chainAction.replace(/\s+/g, '').toUpperCase()
    switch (chainAction) {
      case 'PUBLISH':
        await publish(parentId, {
          id: assetDetails.id,
          uri: assetDetails.uri,
          referenceOf: ZeroHash
        })
        break
      case 'SET_URI':
        await setUri(assetDetails.id, assetDetails.uri)
        break
      default:
        console.log('NOOP')
        break
    }

    results.push({
      assetHash,
      type: content?.type
    })
  }

  return results
}
