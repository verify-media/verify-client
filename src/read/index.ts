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
import { AssetNode } from 'src/types/schema'
import { fetchFromIPFS as fetchFileFromPinata } from '../storage/pinata'
export { fetchFileFromPinata }

// limitations under the License.
export { fetchFromIPFS } from '../storage/ipfs'
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
 * @hidden
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
  const assetMeta = assetDetail.provenance
  let encContent: Uint8Array | AssetNode | null = null
  if (pinataConfig?.pinataKey && pinataConfig?.pinataSecret) {
    encContent = (await fetchFileFromPinata(
      assetMeta.data.locations[0].uri,
      'asset',
      pinataConfig
    )) as AssetNode
  } else {
    encContent = await fetchFromIPFS(
      assetMeta.data.locations[0].uri,
      'asset',
      ipfsGateway
    )
  }

  if (assetMeta.data.type === 'text/html') {
    const decoder = new TextDecoder()
    const decoded = decoder.decode(encContent as Uint8Array)

    const ciphertext = assetMeta.data.access
      ? assetMeta.data.access['lit-protocol']['ciphertext']
      : ''

    const decryptedAsset = await decryptAsset({
      ciphertext: ciphertext,
      dataToEncryptHash: decoded,
      contentHash: assetMeta.data.contentBinding.hash
    })
    const decryptedString = decoder.decode(decryptedAsset as Uint8Array)

    return {
      type: assetMeta.data.type,
      content: decryptedString
    }
  } else {
    const decoder = new TextDecoder()
    const decoded = decoder.decode(encContent as Uint8Array)
    const ciphertext = assetMeta.data.access
      ? assetMeta.data.access['lit-protocol']['ciphertext']
      : ''
    const decryptedAsset = await decryptAsset({
      ciphertext: ciphertext,
      dataToEncryptHash: decoded,
      contentHash: assetMeta.data.contentBinding.hash
    })
    const buffer = Buffer.from(decryptedAsset)

    return {
      type: assetMeta.data.type,
      content: buffer
    }
  }
}
