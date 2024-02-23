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
import { Wallet, Contract, ethers, utils } from 'ethers'
import { getConfig } from '../../utils/config'
import { IDENTITY_ABI } from './types'
import { debugLogger } from '../../utils/logger'
import { SIGNATURE_DEADLINE, getIdentityContractAddress } from '../../constants'
import { getCurrentBlockTime } from '../../utils/chain'

/**
 * @hidden
 * @returns
 */
const getWalletInstance = (): Wallet => {
  const { pvtKey, rpcUrl } = getConfig()
  const wallet = new Wallet(
    pvtKey || '',
    new ethers.providers.JsonRpcProvider(rpcUrl)
  )

  return wallet
}

const getIntermediateWalletAddress = async (): Promise<string> => {
  const wallet = getWalletInstance()
  debugLogger().debug('using wallet signer')

  return wallet.address
}

/**
 * @hidden
 * @returns
 */
const getRootWalletInstance = (): Wallet => {
  const { rootPvtKey, rpcUrl } = getConfig()
  if (!rootPvtKey) {
    throw new Error(
      'rootPvtKey cannot be empty, either set and env var ROOT_PVT_KEY or pass a value to this function'
    )
  }
  const wallet = new Wallet(
    rootPvtKey,
    new ethers.providers.JsonRpcProvider(rpcUrl)
  )
  debugLogger().debug('root wallet address: %s', wallet.address)

  return wallet
}

/**
 * @hidden
 * @returns
 */
export const getContractInstance = (): Contract => {
  const interMediateWallet = getWalletInstance()
  const identityContract = new Contract(
    getIdentityContractAddress(getConfig().stage),
    IDENTITY_ABI,
    interMediateWallet
  )

  return identityContract
}

/**
 * @hidden
 * @returns
 */
export const buildDomainSeparator = async (): Promise<string> => {
  const contract = getContractInstance()
  const eip = await contract.eip712Domain()

  const domainSeparator = utils.keccak256(
    utils.defaultAbiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
      [
        utils.keccak256(
          utils.toUtf8Bytes(
            'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'
          )
        ),
        utils.id(eip.name),
        utils.id(eip.version),
        eip.chainId,
        getIdentityContractAddress(getConfig().stage)
      ]
    )
  )

  return domainSeparator
}

/**
 * @hidden
 * @param structData
 * @returns
 */
export const genTypedSignatureHash = async (
  structData: string,
  domainSeparator?: string
): Promise<string> => {
  const { rootPvtKey } = getConfig()
  if (!rootPvtKey) {
    throw new Error(
      'rootPvtKey cannot be empty, either set and env var ROOT_PVT_KEY or pass a value to this function'
    )
  }
  const structHash = utils.keccak256(structData)
  let DOMAIN_SEPARATOR = ''
  if (domainSeparator) {
    DOMAIN_SEPARATOR = domainSeparator
  } else {
    DOMAIN_SEPARATOR = await buildDomainSeparator()
  }

  debugLogger().debug('structHash: %s', structHash)

  const digest = utils.arrayify(
    utils.keccak256(
      '0x1901' + DOMAIN_SEPARATOR.substring(2) + structHash.substring(2)
    )
  )

  const signingKey = new utils.SigningKey(rootPvtKey)
  const signature = signingKey.signDigest(digest)
  const serializedSignature = utils.joinSignature(signature)

  return serializedSignature
}

/**
 * generates the struct data to be used to generate the signature for linking the intermediate wallet with the root wallet.
 * @param intermediateWalletAddress intermediate wallet address
 * @param rootWalletAddress root wallet address
 * @param expiry time in seconds till the intermediate wallet is valid
 * @param deadline time in seconds till the token is valid
 * @returns returns the struct data to be used to generate the signature
 * @hidden
 */
export const constructTokenData = async (
  intermediateWalletAddress: string,
  rootWalletAddress: string,
  expiry: number,
  deadline: number
): Promise<string> => {
  const { chainId } = getConfig()
  const identityContract = getContractInstance()
  const nonce = await identityContract.nonces(rootWalletAddress)
  debugLogger().debug('nonce: %s', nonce)

  const structData = utils.defaultAbiCoder.encode(
    [
      'bytes32',
      'address',
      'address',
      'uint256',
      'uint256',
      'uint256',
      'uint256'
    ],
    [
      utils.keccak256(
        utils.toUtf8Bytes(
          'register(address root,address intermediate,uint256 expiry,uint256 nonce,uint256 chainID,uint256 deadline)'
        )
      ), //This is the hash of the register function type
      rootWalletAddress, // Root Address
      intermediateWalletAddress, // Intermediate Address
      expiry, // Expiry of registration
      nonce, // nonce
      chainId,
      deadline // Expiry of the signature
    ]
  )

  return structData
}

/**
 * @hidden
 * @param intermediateWalletAddress
 * @param expiry
 * @param deadline
 * @returns
 */
const getSignatureToRegister = async (
  intermediateWalletAddress: string,
  expiry: number,
  deadline: number
): Promise<string> => {
  const rootWallet = getRootWalletInstance()
  const structData = await constructTokenData(
    intermediateWalletAddress,
    rootWallet.address,
    expiry,
    deadline
  )

  return genTypedSignatureHash(structData)
}

/**
 * Registers an intermediate wallet.
 *
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 * @throws {Error} If the intermediate wallet is not set.
 */
export const register =
  async (): Promise<ethers.providers.TransactionReceipt> => {
    const { walletExpiryDays, chainId } = getConfig()
    const rootWallet = getRootWalletInstance()
    const identityContract = getContractInstance()

    debugLogger().debug(`walletExpiryDays ${walletExpiryDays}`)
    debugLogger().debug(`rootWallet ${rootWallet.address}`)
    debugLogger().debug(`identityContract ${identityContract.address}`)

    // fetch intermediate wallet address by kmsid or env var
    const address = await getIntermediateWalletAddress()

    debugLogger().debug('registering intermediate wallet: %s', address)

    if (!address) throw new Error('intermediate wallet not set')

    debugLogger().debug('getting signature')

    const now = (await getCurrentBlockTime()).getTime()
    debugLogger().debug(`block time ${now}`)

    const expiry = now + 60 * 60 * 24 * walletExpiryDays // 1 day: 60 secs by 60 mins by 24 hrs
    const deadline = now + SIGNATURE_DEADLINE
    const signature = await getSignatureToRegister(address, expiry, deadline)

    debugLogger().debug('signature: %s', signature)

    const txn: ethers.providers.TransactionResponse =
      await identityContract.register(
        signature,
        rootWallet.address,
        address,
        expiry,
        chainId,
        deadline
      )

    debugLogger().debug('intermediate wallet registered: %s', txn.hash)
    const receipt: ethers.providers.TransactionReceipt = await txn.wait()
    debugLogger().debug(
      'intermediate wallet registered receipt: %s',
      receipt.transactionHash
    )

    return receipt
  }

/**
 *
 * @param intermediateWalletAddress
 * @param rootWalletAddress
 * @param deadline
 * @hidden
 * @returns
 */
export const constructUnlinkTokenData = async (
  intermediateWalletAddress: string,
  rootWalletAddress: string,
  deadline: number
): Promise<string> => {
  const { chainId } = getConfig()
  const identityContract = getContractInstance()
  const nonce = await identityContract.nonces(rootWalletAddress)
  debugLogger().debug('nonce: %s', nonce)

  const structData = utils.defaultAbiCoder.encode(
    ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
    [
      utils.keccak256(
        utils.toUtf8Bytes(
          'unregister(address root,address intermediate,uint256 nonce,uint256 chainID,uint256 deadline)'
        )
      ), //This is the hash of the register function type
      rootWalletAddress, // Root Address
      intermediateWalletAddress, // Intermediate Address
      nonce, // nonce
      chainId,
      deadline // Expiry of the signature
    ]
  )

  return structData
}

/**
 * @hidden
 * @param intermediateWalletAddress
 * @param deadline
 * @returns
 */
const getSignatureToUnRegister = async (
  intermediateWalletAddress: string,
  deadline: number
): Promise<string> => {
  const rootWallet = getRootWalletInstance()
  const structData = await constructUnlinkTokenData(
    intermediateWalletAddress,
    rootWallet.address,
    deadline
  )

  return genTypedSignatureHash(structData)
}

/**
 * Unregisters an intermediate wallet.
 *
 * @param {string} interMediateWalletPvtKey - The private key of the intermediate wallet to unregister.
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 * @throws {Error} If the intermediate wallet is not set.
 */
export const unregister =
  async (): Promise<ethers.providers.TransactionReceipt> => {
    const { chainId } = getConfig()
    const rootWallet = getRootWalletInstance()
    const identityContract = getContractInstance()

    debugLogger().debug(`rootWallet ${rootWallet.address}`)
    debugLogger().debug(`identityContract ${identityContract.address}`)

    const address = await getIntermediateWalletAddress()

    if (!address) throw new Error('intermediate wallet not set')

    const now = (await getCurrentBlockTime()).getTime()
    const deadline = now + SIGNATURE_DEADLINE
    debugLogger().debug(`block time ${now}`)
    const signature = await getSignatureToUnRegister(address, deadline)

    const txn: ethers.providers.TransactionResponse =
      await identityContract.unregister(
        signature,
        rootWallet.address,
        address,
        chainId,
        deadline
      )

    const receipt: ethers.providers.TransactionReceipt = await txn.wait()

    return receipt
  }

/**
 * Checks if a wallet is registered on chain.
 *
 * @param {string} address - The address of the wallet to check.
 * @returns {Promise<boolean>} A promise that resolves with a boolean indicating whether the wallet is registered or not.
 */
export const registered = async (address: string): Promise<boolean> => {
  const identityContract = getContractInstance()

  return identityContract.registered(address)
}

/**
 * Returns the address of the  root wallet - an intermediate wallet is registered to.
 *
 * @param {string} address - The address of the intermediate wallet to check.
 * @returns {Promise<string>} A promise that resolves with the address of the root wallet.
 */
export const whoIs = async (address: string): Promise<string> => {
  const identityContract = getContractInstance()

  return identityContract.whoIs(address)
}

/**
 * Registers the root wallet.
 *
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 * @throws {Error} If the organization name is not provided.
 */
export const registerRoot = async (
  orgName: string
): Promise<ethers.providers.TransactionReceipt> => {
  if (!orgName) throw new Error('orgName cannot be empty')
  const rootWallet = getRootWalletInstance()
  const identityContract = getContractInstance()
  debugLogger().debug('registering root wallet: %s', rootWallet.address)
  const txn: ethers.providers.TransactionResponse =
    await identityContract.registerRoot(rootWallet.address, orgName)
  debugLogger().debug('root wallet registered: %s', txn.hash)
  const receipt: ethers.providers.TransactionReceipt = await txn.wait()

  return receipt
}

/**
 * Registers the root wallet.
 *
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 * @throws {Error} If the organization name is not provided.
 * @hidden
 */
export const registerRootWithVerify = async (
  rootWalletAddress: string,
  orgName: string
): Promise<ethers.providers.TransactionReceipt> => {
  if (!rootWalletAddress) throw new Error('root wallet address cannot be empty')
  if (!orgName) throw new Error('orgName cannot be empty')
  const identityContract = getContractInstance()
  debugLogger().debug('registering root wallet: %s', rootWalletAddress)
  const txn: ethers.providers.TransactionResponse =
    await identityContract.registerRoot(rootWalletAddress, orgName)
  debugLogger().debug('root wallet registered: %s', txn.hash)
  const receipt: ethers.providers.TransactionReceipt = await txn.wait()

  return receipt
}

/**
 * Unregisters the root wallet.
 *
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 */
export const unRegisterRoot =
  async (): Promise<ethers.providers.TransactionReceipt> => {
    const rootWallet = getRootWalletInstance()
    const identityContract = getContractInstance()

    debugLogger().debug('unregistering root wallet: %s', rootWallet.address)

    const txn: ethers.providers.TransactionResponse =
      await identityContract.unregisterRoot(rootWallet.address)

    debugLogger().debug('root wallet unregistered: %s', txn.hash)

    const receipt: ethers.providers.TransactionReceipt = await txn.wait()

    return receipt
  }

/**
 * Unregisters the root wallet.
 *
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 * @hidden
 */
export const unRegisterRootFromVerify = async (
  rootWallet: string
): Promise<ethers.providers.TransactionReceipt> => {
  const identityContract = getContractInstance()

  debugLogger().debug('unregistering root wallet: %s', rootWallet)

  const txn: ethers.providers.TransactionResponse =
    await identityContract.unregisterRoot(rootWallet)

  debugLogger().debug('root wallet unregistered: %s', txn.hash)

  const receipt: ethers.providers.TransactionReceipt = await txn.wait()

  return receipt
}

/**
 * get nonce for the signing wallet
 * @returns {Promise<number>}
 * @hidden
 */
export const getSigningWalletNonce = async (): Promise<number> => {
  const address = await getIntermediateWalletAddress()
  const identityContract = getContractInstance()

  return await identityContract.nonces(address)
}

/**
 * returns root wallet address against the org name.
 * @param orgName
 * @returns {Promise<string>}
 */
export const nameToRoot = async (orgName: string): Promise<string> => {
  const identityContract = getContractInstance()

  debugLogger().debug('fetching root address for org name: %s', orgName)

  const rootAddress = await identityContract.nameToRoot(orgName)
  debugLogger().debug('root wallet registered: %s', rootAddress)

  return rootAddress
}

/**
 * returns org name against the root wallet address.
 * @param orgName
 * @returns {Promise<string>}
 */
export const rootName = async (rootWalletAddress: string): Promise<string> => {
  const identityContract = getContractInstance()

  debugLogger().debug(
    'fetching org name for the root address name: %s',
    rootWalletAddress
  )

  const orgName = await identityContract.rootName(rootWalletAddress)
  debugLogger().debug('org registered: %s', orgName)

  return orgName
}
