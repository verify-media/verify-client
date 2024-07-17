import { Content, AssetNode, LocationProtocol } from '../types/schema'
import {
  createHierarchicalNode,
  getNode,
  publish,
  setAccessAuth,
  setUri
} from '../graph/protocol'
import {
  addSignatureData,
  hashData,
  signAssetNode,
  uploadToPinata,
  processAsset,
  addCID
} from '../write'
import { ensureHttps, ensureIPFS } from '../utils/app'
import path from 'path'
import { fetchFileFromPinata } from '../read'
import { LicenseType } from '../types/app'

const ZeroHash =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

//TODO maybe pass origin and BU separately
export const constructAssetNode = (
  content: Content,
  hash: string,
  license: LicenseType
): AssetNode => {
  console.log(hash, license)
  if (content.type === 'text') {
    const asset: AssetNode = {
      version: '1.0.0',
      data: {
        description: content.description,
        type: content.contentType,
        encrypted: true,
        access: {
          'verify-auth': {
            license: license
          }
        },
        locations: [
          {
            protocol: LocationProtocol.HTTPS,
            uri: ensureHttps(content.uri)
          }
        ],
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
    const description = `an image owned by ${content.authority.name}`
    const asset: AssetNode = {
      version: '1.0.0',
      data: {
        description: description,
        type: content.contentType,
        encrypted: true,
        access: {
          'verify-auth': {
            license: license
          }
        },
        locations: [
          {
            protocol: LocationProtocol.HTTPS,
            uri: ensureHttps(content.uri)
          }
        ],
        manifest: {
          uri: ensureHttps(content.uri),
          title: filename,
          alt: '',
          description: description,
          caption: '',
          creditedSource: content.authority.name,
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

const genHash = async (
  content: Content
): Promise<{
  assetHash: string
  assetCid: string
}> => {
  let assetHash = ''
  let assetCid = ''
  if (content.type === 'text') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { body: textBody } = content
    assetHash = hashData(textBody || '')
  } else {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { hash, cid } = await processAsset(content.uri)
    assetHash = hash
    assetCid = cid
  }

  return {
    assetHash,
    assetCid
  }
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

export const publishAssets = async (
  contents: Content[],
  ipfsConfig: {
    pinataKey: string
    pinataSecret: string
  },
  orgNodeId: string,
  license: LicenseType
): Promise<
  {
    assetHash: string
    type: string
  }[]
> => {
  // input
  if (!license) {
    throw new Error('license is required')
  }
  const results = []
  for (const content of contents) {
    let assetNode = null
    let chainAction = 'NOOP'
    const assetDetails = {
      id: '',
      uri: ''
    }
    console.log(`generate asset hash...`)
    // gen asset hash
    const { assetHash, assetCid } = await genHash(content)

    console.log(`check if asset exists on chain...`)
    // check if asset exists on chain
    const {
      isAssetNew,
      existingAssetMetaUri,
      assetNode: _assetNode
    } = await checkAssetExists(assetHash, ipfsConfig)

    assetNode = _assetNode

    //if asset is new
    if (isAssetNew) {
      console.log(`new asset`)
      assetNode = constructAssetNode(content, assetHash, license)
      addCID(assetNode, assetCid)

      console.log('sign asset node.....')
      // sign assetNode
      const signature = await signAssetNode(assetNode.data)
      assetNode = addSignatureData(assetNode, signature)
      console.log('upload asset meta to ipfs')
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
      console.log('existing asset')
      if (!assetNode)
        throw new Error('failed to construct asset node from onchain metadata')

      const prevAssetNode = assetNode

      console.log('construct new asset node to compare with prev')
      // construct new assetNode
      let newAssetNode = constructAssetNode(content, assetHash, license)

      // check if asset metadata has changed
      if (genAssetMetaHash(prevAssetNode) === genAssetMetaHash(newAssetNode)) {
        console.log('no change')
        chainAction = 'NOOP'
      } else {
        // populate new assetNode with actual asset details
        newAssetNode.data.locations = prevAssetNode.data.locations
        newAssetNode.data.access = prevAssetNode.data.access
        if (content.type !== 'text') {
          // update pub date since metadata changed // since pub date for all non text assets is system date
          newAssetNode.data.manifest.published = new Date().toISOString()
        }
        if (!newAssetNode.data.manifest.history) {
          newAssetNode.data.manifest.history = []
        }
        newAssetNode.data.manifest.history.push(
          ensureIPFS(existingAssetMetaUri)
        )

        console.log('sign asset node')
        // sign assetNode
        const signature = await signAssetNode(newAssetNode.data)
        newAssetNode = addSignatureData(newAssetNode, signature)

        console.log('upload asset meta to ipfs')
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

        chainAction = 'SET_URI'

        assetNode = newAssetNode
      }
    }

    const licenseNode = await createHierarchicalNode(
      orgNodeId,
      license,
      orgNodeId
    )
    const assetTypeNode = await createHierarchicalNode(
      orgNodeId,
      content.type,
      licenseNode
    )

    const date = new Date(assetNode.data.manifest.published)
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // getMonth() returns a zero-based value (where 0 indicates the first month)

    const yearNode = await createHierarchicalNode(
      orgNodeId,
      year.toString(),
      assetTypeNode
    )
    const monthNode = await createHierarchicalNode(
      orgNodeId,
      month.toString(),
      yearNode
    )
    const dateNode = await createHierarchicalNode(
      orgNodeId,
      date.toString(),
      monthNode
    )

    const parentId = dateNode

    chainAction = chainAction.replace(/\s+/g, '').toUpperCase()
    console.log(`perform chain action: ${chainAction} for ${assetDetails.id}`)
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

    await setAccessAuth(assetNode.data.contentBinding.hash, license)

    results.push({
      assetHash,
      type: content?.type
    })
  }

  return results
}
