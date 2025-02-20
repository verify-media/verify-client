// Copyright 2023 Blockchain Creative Labs LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
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
import { SiweMessage } from 'siwe'
import { debugLogger } from '../utils/logger'
import { AssetDetails } from '../graph/protocol/types'
import { fetchFromIPFS } from '../storage/ipfs'
import { decryptAsset } from '../encryption/lit'
import { AssetNode } from '../types/schema'
import { Article, Content } from './types'
import { fetchFromIPFS as fetchFileFromPinata } from '../storage/pinata'
import { getAssetDetails, getWalletBalance } from '../graph/protocol'
import { EncryptAssetResponse } from 'src/encryption/lit/types'
import { decodeEtherError } from '../utils/error/decode-ether-error'
import * as parser from 'fast-xml-parser'
export { fetchFileFromPinata, getWalletBalance, decodeEtherError }

// limitations under the License.
export { fetchFromIPFS } from '../storage/ipfs'
export { fetchFromS3 } from '../storage/s3'
export { fetchData } from '../storage'
export { decryptAsset } from '../encryption/lit'
export {
  whoIs,
  registered,
  nameToRoot,
  rootName,
  getSigningWalletNonce
} from '../graph/identity'
export {
  getNode,
  verifyAsset,
  getTotalSuppy,
  getNodesCreated,
  checkAuth,
  checkRefAuth,
  getTokenToNode,
  getChildrenNodes,
  getParentNode,
  getArticleProvenance,
  getAssetDetails
} from '../graph/protocol'

export { checkAuth as checkAllowListAuth } from '../graph/licenses/allow-list'
export {
  checkAuth as checkAuthorizerAuth,
  getNode as getAuthorizerNode,
  getRoot as getAuthorizerRoot
} from '../graph/licenses/authorizer'
export {
  checkAuth as checkEmbargoAuth,
  getAssetPrice,
  getEmbargo
} from '../graph/licenses/timebased'

/**
 * Validates a wallet signed siwe message and returns the original statement and wallet address that originally signed the statement
 *
 * @param {string} message - The SIWE message to verify.
 * @param {string} signature - The signature of the SIWE message.
 *
 * @returns {Promise<{ message: string, address: string }>} A promise that resolves with an object containing the statement of the SIWE message and the Ethereum address.
 *
 * @throws {Error} If the signature is not valid.
 *
 * @hidden
 */
export const validateRequest = async (
  message: string,
  signature: string
): Promise<{
  message: string
  address: string
}> => {
  const siweMessage = new SiweMessage(message)
  const fields = await siweMessage.verify({ signature })

  return {
    message: fields.data.statement || '',
    address: fields.data.address
  }
}

/**
 * Fetches image data from a URL and returns it as a `Uint8Array`.
 *
 * @param {string} url - The URL of the image.
 *
 * @returns {Promise<Uint8Array>} A promise that resolves with the image data as a `Uint8Array`.
 *
 * @throws {Error} If the URL is not provided or the image data cannot be fetched.
 */
export async function getImageData(url: string): Promise<Uint8Array> {
  debugLogger().debug(`url passed ${url}`)
  if (!url) {
    throw new Error('image url was not passed')
  }
  const blob = await fetch(url).then((res) => res.blob())
  debugLogger().debug(`image data fetched`)
  const arrayBuffer = await blob.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  debugLogger().debug(`gen buffer from image data blob`)

  return new Uint8Array(Buffer.from(buffer))
}

/**
 * returns decrypted asset content basis the asset details passed
 * @param assetDetail {@link AssetDetails}
 * @param ipfsGateway ipfs gateway url
 * @param pinataConfig pinata config
 * @returns <Promise<{type: string, content: string | Buffer}>}
 */
/* istanbul ignore next */
export async function decrypt(
  assetDetail: AssetDetails,
  ipfsGateway = '',
  pinataConfig?: {
    pinataKey: string
    pinataSecret: string
  }
): Promise<{
  type: string
  content: string | Buffer
}> {
  debugLogger().debug(
    `decrypting asset ${assetDetail.meta.data.contentBinding.hash}`
  )
  const assetMeta = assetDetail.meta
  let encContent: Uint8Array | AssetNode | null = null
  if (pinataConfig?.pinataKey && pinataConfig?.pinataSecret) {
    debugLogger().debug(`fetching asset from pinata`)
    encContent = (await fetchFileFromPinata(
      assetMeta.data.locations[0].uri,
      'asset',
      pinataConfig
    )) as AssetNode
  } else {
    debugLogger().debug(`fetching asset from ipfs`)
    encContent = await fetchFromIPFS(
      assetMeta.data.locations[0].uri,
      'asset',
      ipfsGateway
    )
  }

  if (assetMeta.data.type === 'text/html') {
    debugLogger().debug(`decrypting html asset`)
    const decoder = new TextDecoder()
    const decoded = decoder.decode(encContent as Uint8Array)
    const encryptedAsset = JSON.parse(decoded)
    debugLogger().debug(`decoding encrypted asset`)
    const decryptedAsset = await decryptAsset({
      ciphertext: encryptedAsset.ciphertext,
      dataToEncryptHash: encryptedAsset.dataToEncryptHash,
      contentHash: assetMeta.data.contentBinding.hash
    })
    const decryptedString = decoder.decode(decryptedAsset as Uint8Array)

    return {
      type: assetMeta.data.type,
      content: decryptedString
    }
  } else {
    debugLogger().debug(`decrypting non-html asset`)
    const decoder = new TextDecoder()
    const decoded = decoder.decode(encContent as Uint8Array)
    const encryptedAsset = JSON.parse(decoded)
    debugLogger().debug(`decoding encrypted asset`)
    const decryptedAsset = await decryptAsset({
      ciphertext: encryptedAsset.ciphertext,
      dataToEncryptHash: encryptedAsset.dataToEncryptHash,
      contentHash: assetMeta.data.contentBinding.hash
    })
    const buffer = Buffer.from(decryptedAsset)

    return {
      type: assetMeta.data.type,
      content: buffer
    }
  }
}

/**
 * Fetches the asset meta from (self hosted) IPFS gateway or Pinata.
 * @param assetId
 * @param ipfsConfig IPFS gateway and Pinata configuration
 * @returns {@link Promise<Article | Content>}
 */
export async function getData(
  assetId: string,
  ipfsConfig: {
    ipfsGateway: string
    pinataConfig?: {
      pinataKey: string
      pinataSecret: string
    }
  }
): Promise<Article | Content> {
  const { ipfsGateway, pinataConfig } = ipfsConfig

  const assetMeta = await getAssetDetails(assetId, ipfsGateway, pinataConfig)
  // check schema version
  if (assetMeta.meta.version !== '1.0.0') {
    throw new Error('Unsupported schema version, expected 1.0.0')
  }

  const assetUri = assetMeta.meta.data.locations.filter((location) => {
    return (
      location.protocol === 'ipfs' ||
      location.protocol === 'https' ||
      location.protocol === 's3'
    )
  })[0].uri

  const ciphertext =
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    assetMeta.meta.data.access?.['lit-protocol']?.ciphertext || ''

  let dataToEncryptHash = null

  if (pinataConfig?.pinataKey && pinataConfig?.pinataSecret) {
    dataToEncryptHash = await fetchFileFromPinata(
      assetUri,
      'asset',
      pinataConfig
    )
  } else {
    dataToEncryptHash = await fetchFromIPFS(assetUri, 'asset', ipfsGateway)
  }

  if (assetMeta.meta.data.type === 'text/html') {
    const decoder = new TextDecoder()
    const decoded = decoder.decode(dataToEncryptHash as Uint8Array)
    let encryptedAsset: EncryptAssetResponse | null = null
    if (!ciphertext) {
      encryptedAsset = JSON.parse(decoded)
    } else {
      encryptedAsset = {
        ciphertext: ciphertext,
        dataToEncryptHash: decoded
      }
    }
    if (!encryptedAsset) throw new Error('encryptedAsset is null')
    const decryptedAsset = await decryptAsset({
      ciphertext: encryptedAsset.ciphertext,
      dataToEncryptHash: encryptedAsset.dataToEncryptHash,
      contentHash: assetMeta.meta.data.contentBinding.hash
    })
    const decryptedString = decoder.decode(decryptedAsset as Uint8Array)
    const xmlParser = new parser.XMLParser({
      parseTagValue: false,
      allowBooleanAttributes: true
    })
    const response = xmlParser.parse(decryptedString)
    const textResponse = JSON.parse(JSON.stringify(response))
    textResponse.article.orgStruct = assetMeta.orgStruct
    let images = textResponse.article.contents.image
    if (!Array.isArray(images)) {
      images = [images]
    }
    const results = await Promise.all(
      images.map((image: { hash: string }) => {
        return getAssetDetails(image.hash, ipfsGateway, pinataConfig)
      })
    )

    const resultsMap = new Map(
      results.map((result) => [result.meta.data.contentBinding.hash, result])
    )

    textResponse.article.contents.image = images.map(
      (image: { hash: string }) => resultsMap.get(image.hash) || image
    )

    return textResponse as Article
  } else {
    return (await getAssetDetails(
      assetId,
      ipfsGateway,
      pinataConfig
    )) as unknown as Content
  }
}
