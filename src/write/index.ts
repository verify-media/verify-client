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
  createLicenseNode
} from '../graph/protocol'
export { hashData, hash }

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
  const { 'lit-protocol': litProtocol } = assetNodeData?.access || {}
  const result = isValidAssetNode(assetNodeData)
  if (result.error) {
    throw new Error(result.error.message)
  }
  if (assetNodeData?.encrypted && !litProtocol?.version) {
    throw new Error('encrypted asset is missing version')
  }
  const hash = hashData(JSON.stringify(assetNodeData))
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
    data: {
      description: '',
      type: '',
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
      ${otherContents.map((content) => {
        return `<image>
                  <title>${content.title}</title>
                  <contentType>${content.contentType}</contentType>
                  <description>${content.description}</description>
                  <creditedSource>${content.creditedSource}</creditedSource>
                  <hash>${content.hash}</hash>
                </image>`
      })}
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
