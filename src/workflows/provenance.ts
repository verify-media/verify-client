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
  addIPFSData,
  addEncryptionData,
  addSignatureData,
  hashData,
  hashImage,
  signAssetNode,
  buildArticleBody,
  uploadToPinata
} from '../write'
import { ensureHttps, ensureIPFS } from '../utils/app'
import path from 'path'
import { fetchFileFromPinata } from '../read'
import { debugLogger } from '../utils/logger'

const ZeroHash =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

const isOwned = (content: Content): boolean => content.ownership === 'owned'

//TODO maybe pass origin and BU separately
/**
 *
 * @param content
 * @param hash
 * @returns
 * @hidden
 */
export const constructAssetNode = (
  content: Content,
  hash: string
): AssetNode => {
  if (content.type === 'text') {
    const asset: AssetNode = {
      version: '1.0.0',
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
          published: content.published,
          history: []
        },
        contentBinding: {
          algo: 'keccak256',
          hash: hash
        }
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
      version: '1.0.0',
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
          published: new Date().toISOString(),
          history: []
        },
        contentBinding: {
          algo: 'keccak256',
          hash: hash
        }
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
  debugLogger().debug(`breaking article to assets`)
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
    debugLogger().debug(`generating asset hash`)
    const assetHash = genHash(content)

    // check if asset exists on chain
    debugLogger().debug(`checking if asset exists on chain`)
    const {
      isAssetNew,
      existingAssetMetaUri,
      assetNode: _assetNode
    } = await checkAssetExists(assetHash, ipfsConfig)

    assetNode = _assetNode

    //if asset is new
    if (isAssetNew) {
      debugLogger().debug(`constructing new asset node from content`)
      assetNode = constructAssetNode(content, assetHash)
      debugLogger().debug(`encrypting asset`)
      // encrypt asset
      const asset = await getAssetBlob(content)

      console.log('encrypt asset')
      const encryptedAsset = await encryptAsset({
        content: asset as Blob,
        contentHash: assetHash
      })

      // add encryption data to assetNode
      debugLogger().debug(`adding encryption data to asset node`)
      assetNode = addEncryptionData(assetNode)

      // upload encrypted asset to IPFS
      debugLogger().debug(`uploading encrypted asset to IPFS`)
      const encoder = new TextEncoder()
      const encContent = encoder.encode(JSON.stringify(encryptedAsset))

      console.log('upload to ipfs')
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
      debugLogger().debug(`adding IPFS data to asset node`)
      assetNode = addIPFSData(assetNode, ensureIPFS(assetLocation.IpfsHash))

      console.log('sign asset node')
      // sign assetNode
      debugLogger().debug(`signing asset node`)
      const signature = await signAssetNode(assetNode.data)
      debugLogger().debug(`adding signature data to asset node`)
      assetNode = addSignatureData(assetNode, signature)

      console.log('upload asset meta to ipfs')
      // upload asset meta to IPFS
      debugLogger().debug(`uploading asset meta to IPFS`)
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

      debugLogger().debug(`asset is new, publishing to chain`)
      chainAction = 'PUBLISH'
    } else {
      // if asset exists on chain
      // get existing assetNode
      debugLogger().debug(`asset exists on chain, fetching asset node`)
      assetNode = _assetNode
      if (!assetNode)
        throw new Error('failed to construct asset node from onchain metadata')

      const prevAssetNode = assetNode

      // construct new assetNode
      debugLogger().debug(`constructing new asset node from content`)
      let newAssetNode = constructAssetNode(content, assetHash)

      console.log('compare asset meta')
      // check if asset metadata has changed
      debugLogger().debug(`checking if asset metadata has changed`)
      if (genAssetMetaHash(prevAssetNode) === genAssetMetaHash(newAssetNode)) {
        debugLogger().debug(`asset metadata has not changed`)
        chainAction = 'NOOP'
      } else {
        debugLogger().debug(`asset metadata has changed`)
        // populate new assetNode with actual asset details
        newAssetNode.data.locations = prevAssetNode.data.locations
        newAssetNode.data.access = prevAssetNode.data.access
        if (content.type !== 'text') {
          debugLogger().debug(`asset is not text, updating published date`)
          // update pub date since metadata changed // since pub date for all non text assets is system date
          newAssetNode.data.manifest.published = new Date().toISOString()
        }
        debugLogger().debug(`adding history to asset node`)
        if (
          newAssetNode &&
          newAssetNode.data &&
          newAssetNode.data.manifest &&
          newAssetNode.data.manifest.history
        ) {
          newAssetNode.data.manifest.history.push(
            ensureIPFS(existingAssetMetaUri)
          )
        } else {
          // Handle the case where newAssetNode.data.manifest.history is undefined
        }

        // sign assetNode
        debugLogger().debug(`signing asset node`)
        const signature = await signAssetNode(newAssetNode.data)
        newAssetNode = addSignatureData(newAssetNode, signature)

        // upload asset meta to IPFS
        debugLogger().debug(`uploading asset meta to IPFS`)
        const assetMetaLocation = await uploadToPinata({
          data: {
            name: newAssetNode.data.contentBinding.hash,
            body: newAssetNode
          },
          config: {
            pinataKey: ipfsConfig.pinataKey,
            pinataSecret: ipfsConfig.pinataSecret
          },
          type: 'meta'
        })

        if (!assetMetaLocation?.IpfsHash)
          throw new Error('failed to upload asset to IPFS')

        assetDetails.id = newAssetNode.data.contentBinding.hash
        assetDetails.uri = ensureIPFS(assetMetaLocation.IpfsHash)

        if (
          content.ownership === 'owned' ||
          (content.ownership === 'licensed' &&
            content.licensedFrom &&
            content.licensedFrom.trim() !== '')
        ) {
          debugLogger().debug(`asset is owned/licensed, updating on chain`)
          chainAction = content.type === 'text' ? 'PUBLISH' : 'SET_URI'
          debugLogger().debug(`chain action: ${chainAction}`)
        }
      }
    }

    let parentId = ''

    // assets owned by publisher
    if (content.ownership === 'owned') {
      debugLogger().debug(`asset is owned by publisher`)
      if (content.type === 'text') {
        debugLogger().debug(`asset is text`)
        // text node is an article node and hence gets published as
        // orgNode ==> originalMaterialNode ==> articleNode ==> articleAsset
        debugLogger().debug(`creating article node`)
        parentId = await createArticleNode(
          article.metadata.origin,
          article.metadata.id,
          org.ogNodeId
        )
        debugLogger().debug(`parent id: ${parentId}`)
      } else {
        // non text nodes are assets and hence get published as
        // orgNode ==> originalMaterialNode ==> assetNode
        debugLogger().debug(`asset is not text`)
        parentId = org.ogNodeId
        debugLogger().debug(`parent id: ${parentId}`)
      }
    }

    // assets licensed from other publishers
    if (content.ownership === 'licensed') {
      debugLogger().debug(`asset is licensed from another publisher`)
      if (!content.licensedFrom)
        throw new Error('content.licensedFrom is required')

      console.log('create license node')
      parentId = await createLicenseNode(content.licensedFrom, org.orgNodeId)
      debugLogger().debug(`parent id: ${parentId}`)
    }

    chainAction = chainAction.replace(/\s+/g, '').toUpperCase()
    debugLogger().debug(`chain action: ${chainAction}`)
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
