// Copyright 2023 Blockchain Creative Labs LLC
//
// Licensed under the Apache License, Version 2.0 (the "License")
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { Wallet } from 'ethers'
import { debugLogger } from '../utils/logger'
import {
  Article,
  AssetNode,
  AssetNodeData,
  Content,
  LocationProtocol,
  Signature
} from '../types/schema'
import { getConfig } from '../utils/config'
import { hashData, hash, isValidAssetNode, ensureIPFS } from '../utils/app'
import { LicenseType, ProcessedAsset } from '../types/app'
import { genCid } from '../storage'
export { uploadToIPFS } from '../storage/ipfs'
export { uploadToIPFS as uploadToPinata } from '../storage/pinata'
export { encryptAsset } from '../encryption/lit'
export {
  registerRoot,
  unRegisterRoot,
  register,
  unregister
} from '../graph/identity'
export {
  publish,
  setUri,
  publishBulk,
  createNode,
  setAccessAuth,
  setReferenceAuth,
  changeParent,
  registerOrg,
  createArticleNode,
  createLicenseNode,
  createOrgNode,
  createHierarchicalNode
} from '../graph/protocol'
export { hashData, hash, genCid }
export { setAuth as setAllowList } from '../graph/licenses/allow-list'
export { setAuth as setAuthorizer } from '../graph/licenses/authorizer'
export { setPurchaseAccess, setEmbargo } from '../graph/licenses/timebased'
/**
 * Generates a keccak256 hash of the image at the given URL.
 *
 * @param {string} url - The URL of the image to hash.
 * @throws {Error} If no URL was passed.
 * @returns {Promise<string>} A promise that resolves with the keccak256 hash of the image.
 */
export async function hashImage(url: string): Promise<string> {
  debugLogger().debug(`url passed ${url}`)
  if (!url) {
    throw new Error('image url was not passed')
  }
  const blob = await fetch(url).then((res) => res.blob())
  debugLogger().debug(`image data fetched`)
  const arrayBuffer = await blob.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  debugLogger().debug(`gen buffer from image data blob`)
  const imageHash = hash(new Uint8Array(Buffer.from(buffer)))
  debugLogger().debug(`hash generated`)

  return imageHash
}

/**
 * Signs a message with a private key.
 *
 * @param {string} message - The message to sign.
 * @returns {Promise<Signature>} A promise that resolves with the signature of the message.
 */
const sign = async (message: string): Promise<Signature> => {
  const { pvtKey } = getConfig()
  const wallet = new Wallet(pvtKey || '')
  const signature = await wallet.signMessage(message)

  return {
    curve: 'sepc256k1',
    signature: signature,
    message: message,
    description:
      'hex encoded sepc256k1 signature of the keccak256 hash of content field with the signers private key'
  }
}

/**
 * Signs asset node data.
 *
 * @param {@link AssetNodeData} assetNodeData - The asset node data to sign.
 * @returns {Promise<{@link Signature}>} A promise that resolves with the signature of the asset node data.
 *
 * @throws {Error} If failed to generate signature.
 */
export const signAssetNode = async (
  assetNodeData: AssetNodeData
): Promise<Signature> => {
  debugLogger().debug(`validate asset node data`)
  const result = isValidAssetNode(assetNodeData)
  if (result.error) {
    throw new Error(result.error.message)
  }
  debugLogger().debug(`asset node data is valid`)
  if (!assetNodeData.access) {
    throw new Error('asset needs to have a valid access field')
  }
  debugLogger().debug(`gen asset node data hash`)

  const hash = hashData(JSON.stringify(assetNodeData))

  debugLogger().debug(`sign asset node data hash`)
  const signature = await sign(hash)

  return signature
}

/**
 * Builds an empty {@link AssetNode} object.
 *
 * @returns An {@link AssetNode} object with all fields initialized to their default values.
 */
export const buildAssetPayload = (assetHash: string): AssetNode => {
  const asset: AssetNode = {
    version: '1.0.0',
    data: {
      description: '',
      type: '',
      access: {
        'verify-auth': {
          license: LicenseType.allowlist
        }
      },
      encrypted: true,
      locations: [],
      manifest: {
        uri: '',
        title: '',
        creditedSource: '',
        signingOrg: {
          name: '',
          unit: ''
        },
        published: ''
      },
      contentBinding: {
        algo: 'keccak256',
        hash: assetHash
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

/**
 * Builds an XML string with a predefined schema to represent the article metadata and content association on chain. This data gets published as a text asset on chain.
 * @param article payload of type {@link Article}
 * @param articleBody main text content of the article
 * @param otherContents other contents of the article like images, videos etc.
 * @returns an XML string with a predefined schema to represent the article metadata and content association on chain
 * @hidden
 */
export const buildArticleBody = (
  article: Article,
  articleBody: string,
  otherContents: Array<Content & { hash: string }>
): string => {
  const xmlBody = `
  <article> 
    <version>1.0</version>   
    <header>
      <title>${article.metadata.title}</title>
      <description>${article.metadata.description}</description>
      <datePublished>${article.metadata.datePublished}</datePublished>      
      <id>${article.metadata.id}</id>
      <canonicalUrl>${article.metadata.uri}</canonicalUrl>
      <publishedBy>${article.metadata.origin}</publishedBy>
    </header>
    <main>
      <section>
        ${articleBody}
      </section>
    </main>
    <contents>
      ${otherContents
        .map((content) => {
          return `<${content.type}>
          <title>${content.title}</title>
          <contentType>${content.contentType}</contentType>
          <description>${content.description}</description>
          <creditedSource>${content.creditedSource}</creditedSource>
          <hash>${content.hash}</hash>
        </${content.type}>`
        })
        .join('')}      
    </contents>
  </article>
`

  return xmlBody
}

/**
 * Adds encryption data to an {@link AssetNode} object.
 *
 * @param asset - The {@link AssetNode} object to add the encryption data to.
 * @returns The {@link AssetNode} object with the added encryption data.
 */
export const addEncryptionData = (asset: AssetNode): AssetNode => {
  asset.data.access = {
    'lit-protocol': {
      version: 'v3'
    }
  }
  asset.data.encrypted = true

  return asset
}

/**
 * Adds IPFS data to an {@link AssetNode} object.
 *
 * @param asset - The {@link AssetNode} object to add the IPFS data to.
 * @param IpfsHash - The IPFS hash of the data.
 * @returns The {@link AssetNode} object with the added IPFS data.
 */
export const addIPFSData = (asset: AssetNode, IpfsHash: string): AssetNode => {
  if (!IpfsHash) throw new Error('ipfs hash cannot be empty')

  asset.data.locations.push({
    uri: ensureIPFS(IpfsHash),
    protocol: LocationProtocol.IPFS
  })

  return asset
}

/**
 * Adds signature data to an {@link AssetNode} object.
 *
 * @param asset - The {@link AssetNode} object to add the signature data to.
 * @param signature - The signature data of type {@link Signature}
 * @returns The {@link AssetNode} object with the added signature data.
 */
export const addSignatureData = (
  asset: AssetNode,
  signature: Signature
): AssetNode => {
  asset.signature = signature

  return asset
}

/**
 * downloads the asset data from the given url and returns the image data
 * @param url asset url
 * @returns {@link ProcessedAsset} object
 */
export async function processAsset(url: string): Promise<ProcessedAsset> {
  debugLogger().debug(`url passed ${url}`)
  if (!url) {
    throw new Error('image url was not passed')
  }
  let size = 0
  const blob = await fetch(url).then((res) => {
    size = Number(res.headers.get('content-length'))

    return res.blob()
  })
  const sizeInMb = size / 1048576
  debugLogger().debug(`image data fetched. Size : ${sizeInMb} MB`)
  const arrayBuffer = await blob.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  debugLogger().debug(`gen buffer from image data blob`)
  const imageHash = hash(new Uint8Array(Buffer.from(buffer)))
  debugLogger().debug(`hash generated`)
  debugLogger().debug(`gen cid from image data blob`)
  const cid = await genCid({
    body: new Uint8Array(Buffer.from(buffer)),
    name: url
  })
  debugLogger().debug(`hash generated`)

  return {
    hash: imageHash,
    sizeInMb,
    blob,
    cid: cid
  }
}

/**
 * processes the asset blob and returns the asset data
 * @param blob asset blob
 * @returns {@link ProcessedAsset} object
 */
export async function processBlob(blob: Blob): Promise<ProcessedAsset> {
  if (!blob) {
    throw new Error('blob was not passed')
  }
  const size = blob.size
  const sizeInMb = size / 1048576
  debugLogger().debug(`blob fetched. Size : ${sizeInMb} MB`)
  const arrayBuffer = await blob.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  debugLogger().debug(`gen buffer from blob`)
  const assetHash = hash(new Uint8Array(Buffer.from(buffer)))
  debugLogger().debug(`hash generated`)
  debugLogger().debug(`gen cid blob`)
  const cid = await genCid({
    body: new Uint8Array(Buffer.from(buffer)),
    name: 'asset-blob'
  })
  debugLogger().debug(`hash generated`)

  return {
    hash: assetHash,
    sizeInMb,
    blob,
    cid: cid
  }
}

/**
 * Adds cid to {@link AssetNode} object under manifest.
 *
 * @param asset - The {@link AssetNode} object to add the IPFS data to.
 * @param cid - cid hash of the data.
 * @returns The {@link AssetNode} object with the added cid.
 */
export const addCID = (asset: AssetNode, cid: string): AssetNode => {
  if (!cid) throw new Error('cid cannot be empty')

  asset.data.manifest.cid = cid

  return asset
}
