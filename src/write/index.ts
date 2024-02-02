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
import { Wallet } from 'ethers'
import { debugLogger } from '../utils/logger'
import {
  Article,
  AssetNode,
  AssetNodeData,
  LocationProtocol,
  Signature
} from '../types/schema'
import { getConfig } from '../utils/config'
import { SiweMessage } from 'siwe'
import { SiweMessageParams } from 'src/encryption/lit/types'
import { hashData, hash, isValidAssetNode } from '../utils/app'
import { ReturnType } from '../encryption/lit/types'
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
  changeParent
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
 * @throws {Error} If failed to generate signature.
 * @returns {Promise<{@link Signature}>} A promise that resolves with the signature of the asset node data.
 */
export const signAssetNode = async (
  assetNodeData: AssetNodeData
): Promise<Signature> => {
  const { 'lit-protocol': litProtocol } = assetNodeData?.access || {}
  const result = isValidAssetNode(assetNodeData)
  if (result.error) {
    throw new Error(result.error.message)
  }
  if (assetNodeData?.encrypted && !litProtocol?.ciphertext) {
    throw new Error('encrypted asset is missing ciphertext')
  }
  const hash = hashData(JSON.stringify(assetNodeData))
  const signature = await sign(hash)

  return signature
}

/**
 *
 * @param param0
 * @returns
 * @hidden
 */
const generateSIWEMessage = async ({
  address,
  chainId,
  uri = 'http://localhost/login',
  version = '1',
  domain = 'localhost',
  origin = ''
}: SiweMessageParams): Promise<string> => {
  let statement = 'signed by ${origin} with root ${address}'
  statement = statement.replace('${origin}', origin)
  statement = statement.replace('${address}', address)
  const siweMessage = new SiweMessage({
    domain,
    chainId,
    statement,
    uri,
    version,
    address
  })

  return siweMessage.prepareMessage()
}

/**
 *
 * @param origin
 * @returns
 * @hidden
 */
export const signRequest = async (
  origin: string
): Promise<{
  signature: string
  message: string
}> => {
  const { rootPvtKey, chainId } = getConfig()
  if (!rootPvtKey) {
    throw new Error(
      'rootPvtKey cannot be empty, either set and env var ROOT_PVT_KEY or pass a value to this function'
    )
  }
  const wallet = new Wallet(rootPvtKey)
  const message = await generateSIWEMessage({
    address: wallet.address,
    chainId: chainId,
    origin
  })
  const signature = await wallet.signMessage(message)

  return { signature, message }
}

const fetchControlPlane = async (
  body: string,
  signature: string,
  origin: string
): Promise<{
  traceId: string
  message: string
}> => {
  const apiHeaders = new Headers()
  apiHeaders.append('x-signature', signature)
  apiHeaders.append('x-origin', origin)
  apiHeaders.append('Content-Type', 'application/json')

  const requestOptions: RequestInit = {
    method: 'POST',
    headers: apiHeaders,
    body: body,
    redirect: 'follow'
  }

  const apiUrl = process.env.SUBMIT_ARTICLE_URL || ''
  const resp = await fetch(apiUrl, requestOptions)

  const data = await resp.json()

  return data
}

/**
 * allows you to submit a request to publish an article using verify's publish pipeline.
 * to start using verify's publish pipeline please [contact us](https://www.verifymedia.com/contact-us.html)
 * @param article {@link Article}
 * @param origin
 * @returns a promise that resolves with a traceId, which can be used to further poll the system for the status of the request.
 */
export const submitRequest = async (
  article: Article,
  origin: string
): Promise<{
  traceId: string
  message: string
}> => {
  const body = {
    message: '',
    payload: article,
    action: 'create'
  }
  const { signature, message } = await signRequest(origin)
  body.message = message

  const resp = await fetchControlPlane(JSON.stringify(body), signature, origin)

  return resp
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

/**
 * Adds encryption data to an {@link AssetNode} object.
 *
 * @param asset - The {@link AssetNode} object to add the encryption data to.
 * @param encryptedAsset - The encrypted asset data of type {@link ReturnType}
 * @returns The {@link AssetNode} object with the added encryption data.
 */
export const addEncryptionData = (
  asset: AssetNode,
  encryptedAsset: ReturnType
): AssetNode => {
  asset.data.access = {
    'lit-protocol': {
      ciphertext: encryptedAsset.ciphertext
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
  asset.data.locations.push({
    uri: IpfsHash || '',
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
