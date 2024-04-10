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
// encrypt content - AES - use the symmetric put that in lit v3

import { getConfig } from '../../utils/config'
import { getClient } from './connect'
import { SiweMessage } from 'siwe'
import { decryptToFile, encryptFile } from '@lit-protocol/lit-node-client'
import { getDefaultAuth } from './access'
import { SiweMessageParams, EncryptAssetResponse, AuthSig } from './types'
import { Wallet, ethers } from 'ethers'
import { debugLogger } from '../../utils/logger'

/**
 * Returns an instance of the Wallet.
 *
 * @returns {Wallet} An instance of the Wallet.
 * @throws {Error} If the configuration is not properly set.
 *
 * @hidden
 */
export const getWalletInstance = (): Wallet => {
  const { pvtKey, rpcUrl } = getConfig()
  const wallet = new Wallet(
    pvtKey || '',
    new ethers.providers.JsonRpcProvider(rpcUrl)
  )

  return wallet
}

/**
 * Generates a SIWE (Signed In With Ethereum) message.
 *
 * @param {SiweMessageParams} params - The parameters for the SIWE message.
 * @param {string} params.address - The Ethereum address.
 * @param {string} params.chainId - The chain ID.
 * @param {string} [params.statement='authsign generated by an identity on verify'] - The statement to sign.
 * @param {string} [params.uri='http://localhost/login'] - The URI.
 * @param {string} [params.version='1'] - The version.
 * @param {string} [params.domain='localhost'] - The domain.
 *
 * @hidden
 * @returns {Promise<SiweMessage>} A promise that resolves with the SIWE message.
 */
export const generateSIWEMessage = async ({
  address,
  chainId,
  statement = 'authsign generated by an identity on verify',
  uri = 'http://localhost/login',
  version = '1',
  domain = 'localhost'
}: SiweMessageParams): Promise<SiweMessage> => {
  return new SiweMessage({
    domain,
    address: address,
    statement,
    uri,
    version,
    chainId,
    expirationTime: new Date(Date.now() + 1000 * 60 * 7).toISOString() // 7 minutes - set expiration time
  })
}

/**
 * @hidden
 */
export const signMessage = async (message: string): Promise<string> => {
  const wallet = getWalletInstance()

  return await wallet.signMessage(message)
}

const getIntermediateWalletAddress = async (): Promise<string> => {
  const wallet = getWalletInstance()
  debugLogger().debug('using wallet signer')

  return wallet.address
}

/**
 * Signs an authentication message.
 *
 * @returns {Promise<AuthSig>} A promise that resolves with the signed authentication message.
 * @throws {Error} If the LIT client is not initialized or the configuration is not properly set.
 *
 * @hidden
 */
export const signAuthMessage = async (): Promise<AuthSig> => {
  const { chainId } = getConfig()
  const address = await getIntermediateWalletAddress()
  await getClient()
  const siweMessage = await generateSIWEMessage({
    address: address,
    chainId
  })
  const messageToSign = siweMessage.prepareMessage()
  const signature = await signMessage(messageToSign)
  const authSig = {
    sig: signature,
    derivedVia: 'web3.eth.personal.sign',
    signedMessage: messageToSign,
    address: address
  }

  return authSig
}

/**
 * Encrypts the provided asset using the LIT protocol.
 *
 * @param {Object} params - parameters for the function.
 * @param {Blob} params.content - asset to encrypt as a Blob.
 * @param {string} params.contentHash - hash of the content.
 *
 * @returns {Promise<{@link EncryptAssetResponse}>} A promise that resolves with an object of type {@link EncryptAssetResponse}.
 * @throws {Error} Throws an error if the LIT client is not initialized.
 */
export const encryptAsset = async ({
  content,
  contentHash
}: {
  content: Blob
  contentHash: string
}): Promise<EncryptAssetResponse> => {
  debugLogger().debug(`read sdk config`)
  const { contractAddress, chain } = getConfig()

  debugLogger().debug(`init lit client`)
  const litClient = await getClient()
  if (!litClient) throw new Error('lit client not initialized')

  // get auth sig
  debugLogger().debug('sign auth message')
  const authSig = await signAuthMessage()

  debugLogger().debug('get access control conditions')
  const authorization = getDefaultAuth(contentHash, chain, contractAddress)

  // Set a timeout to throw an error after a fixed amount of time
  const timeout = setTimeout(() => {
    throw new Error('Operation timed out')
  }, 60 * 1000) // 60 seconds

  debugLogger().debug('encrypt file')
  const encryptedContent = await encryptFile(
    {
      file: content,
      chain,
      authSig,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      unifiedAccessControlConditions: authorization
    },
    litClient
  )

  await litClient.disconnect()
  // If the operation completes before the timeout, clear the timeout
  clearTimeout(timeout)

  const { ciphertext, dataToEncryptHash } = encryptedContent

  return {
    ciphertext,
    dataToEncryptHash
  }
}

/**
 * Decrypts the provided asset using the [LIT](https://developer.litprotocol.com/v3/) protocol.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} params.ciphertext
 * @param {string} params.dataToEncryptHash
 * @param {string} params.contentHash
 *
 * @returns {Promise<Uint8Array>} A promise that resolves with the decrypted asset.
 * @throws {Error} Throws an error if the LIT client is not initialized.
 */
export const decryptAsset = async ({
  ciphertext,
  dataToEncryptHash,
  contentHash
}: {
  ciphertext: string
  dataToEncryptHash: string
  contentHash: string
}): Promise<Uint8Array> => {
  debugLogger().debug(`read sdk config`)
  const { contractAddress, chain } = getConfig()
  debugLogger().debug(`init lit client`)
  const litClient = await getClient()
  if (!litClient) throw new Error('lit client not initialized')

  // get auth sig
  debugLogger().debug('sign auth message')
  const authSig = await signAuthMessage()

  debugLogger().debug('get access control conditions')
  const authorization = getDefaultAuth(contentHash, chain, contractAddress)

  // Set a timeout to throw an error after a fixed amount of time
  const timeout = setTimeout(() => {
    throw new Error('Operation timed out')
  }, 60 * 1000) // 60 seconds

  debugLogger().debug('decrypt file')
  const asset = await decryptToFile(
    {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      unifiedAccessControlConditions: authorization,
      ciphertext,
      dataToEncryptHash,
      authSig,
      chain
    },
    litClient
  )

  await litClient.disconnect()
  // If the operation completes before the timeout, clear the timeout
  clearTimeout(timeout)

  return asset
}
