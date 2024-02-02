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
import { getIdentityContractAddress } from '../../constants'

// 1 day: 60 secs by 60 mins by 24 hrs deadline for the signature to be valid till transaction is mined
const _deadline = 60 * 60 * 24

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

/**
 * @hidden
 * @returns
 */
async function getCurrentBlockTime(): Promise<Date> {
  const { rpcUrl } = getConfig()
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const block = await provider.getBlock('latest')
  const date = new Date(block.timestamp * 1000)

  return date
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
const getContractInstance = (): Contract => {
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
const buildDomainSeparator = async (): Promise<string> => {
  const contract = getContractInstance()
  const eip = await contract.eip712Domain()

  const domainSepartor = utils.keccak256(
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

  return domainSepartor
}

/**
 * @hidden
 * @param structData
 * @returns
 */
const genTypedSignatureHash = async (structData: string): Promise<string> => {
  const { rootPvtKey } = getConfig()
  const structHash = utils.keccak256(structData)
  const DOMAIN_SEPARATOR = await buildDomainSeparator()

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
  const { chainId } = getConfig()
  const rootWallet = getRootWalletInstance()
  const identityContract = getContractInstance()
  const nonce = await identityContract.nonces(rootWallet.address)
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
      rootWallet.address, // Root Address
      intermediateWalletAddress, // Intermediate Address
      expiry, // Expiry of registration
      nonce, // nonce
      chainId,
      deadline // Expiry of the signature
    ]
  )

  return genTypedSignatureHash(structData)
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
  const { chainId } = getConfig()
  const rootWallet = getRootWalletInstance()
  const identityContract = getContractInstance()
  const nonce = await identityContract.nonces(rootWallet.address)
  debugLogger().debug('nonce: %s', nonce)

  const structData = utils.defaultAbiCoder.encode(
    ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
    [
      utils.keccak256(
        utils.toUtf8Bytes(
          'unregister(address root,address intermediate,uint256 nonce,uint256 chainID,uint256 deadline)'
        )
      ), //This is the hash of the register function type
      rootWallet.address, // Root Address
      intermediateWalletAddress, // Intermediate Address
      nonce, // nonce
      chainId,
      deadline // Expiry of the signature
    ]
  )

  return genTypedSignatureHash(structData)
}

/**
 * Registers an intermediate wallet.
 *
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt. [ref](https://docs.verifymedia.com/publishing/identity/contract/#registerbytes-memory-signature-address-root-address-intermediate-uint256-expiry-uint256-chainid-uint256-deadline)
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 * @throws {Error} If the intermediate wallet is not set.
 */
export const register =
  async (): Promise<ethers.providers.TransactionReceipt> => {
    const { walletExpiryDays, chainId } = getConfig()
    const rootWallet = getRootWalletInstance()
    const identityContract = getContractInstance()
    const now = (await getCurrentBlockTime()).getTime()

    debugLogger().debug(`walletExpiryDays ${walletExpiryDays}`)
    debugLogger().debug(`rootWallet ${rootWallet.address}`)
    debugLogger().debug(`identityContract ${identityContract.address}`)
    debugLogger().debug(`block time ${now}`)

    const expiry = now + 60 * 60 * 24 * walletExpiryDays // 1 day: 60 secs by 60 mins by 24 hrs
    const deadline = now + _deadline

    const interMediateWallet = getWalletInstance()
    const address = interMediateWallet.address

    debugLogger().debug('registering intermediate wallet: %s', address)

    if (!address) throw new Error('intermediate wallet not set')

    debugLogger().debug('getting signature')

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
 * Unregisters an intermediate wallet.
 *
 * @param {string} interMediateWalletPvtKey - The private key of the intermediate wallet to unregister. [ref](https://docs.verifymedia.com/publishing/identity/contract/#unregisterbytes-memory-signature-address-root-address-intermediate-uint256-chainid-uint256-deadline)
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 * @throws {Error} If the intermediate wallet is not set.
 */
export const unregister =
  async (): Promise<ethers.providers.TransactionReceipt> => {
    const { chainId } = getConfig()
    const rootWallet = getRootWalletInstance()
    const identityContract = getContractInstance()
    const now = (await getCurrentBlockTime()).getTime()

    debugLogger().debug(`rootWallet ${rootWallet.address}`)
    debugLogger().debug(`identityContract ${identityContract.address}`)
    debugLogger().debug(`block time ${now}`)

    const deadline = now + _deadline
    const interMediateWallet = getWalletInstance()

    if (!interMediateWallet) throw new Error('intermediate wallet not set')

    const signature = await getSignatureToUnRegister(
      interMediateWallet.address,
      deadline
    )

    const txn: ethers.providers.TransactionResponse =
      await identityContract.unregister(
        signature,
        rootWallet.address,
        interMediateWallet.address,
        chainId,
        deadline
      )

    const receipt: ethers.providers.TransactionReceipt = await txn.wait()

    return receipt
  }

/**
 * Checks if a wallet is registered.
 *
 * @param {string} address - The address of the wallet to check. [ref](https://docs.verifymedia.com/publishing/identity/contract/#registeredaddress-user)
 * @returns {Promise<boolean>} A promise that resolves with a boolean indicating whether the wallet is registered.
 */
export const registered = async (address: string): Promise<boolean> => {
  const identityContract = getContractInstance()

  return identityContract.registered(address)
}

/**
 * Returns the address of the  root wallet - an intermediate wallet is registered to. [ref](https://docs.verifymedia.com/publishing/identity/contract/#whoisaddress-identity)
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
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt. [ref](https://docs.verifymedia.com/publishing/identity/contract/#registerrootaddress-root-string-memory-name)
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
 * Unregisters the root wallet. [ref](https://docs.verifymedia.com/publishing/identity/contract/#unregisterrootaddress-root)
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
 * get nonce for the signing wallet
 * @returns {Promise<number>}
 * @hidden
 */
export const getSigningWalletNonce = async (): Promise<number> => {
  const interMediateWallet = getWalletInstance()
  const identityContract = getContractInstance()

  return await identityContract.nonces(interMediateWallet.address)
}

/**
 * returns root wallet address against the org name. [ref](https://docs.verifymedia.com/publishing/identity/contract/#nametorootstring-memory-name)
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
 * returns org name against the root wallet address. [ref](https://docs.verifymedia.com/publishing/identity/contract/#rootnameaddress-user)
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
