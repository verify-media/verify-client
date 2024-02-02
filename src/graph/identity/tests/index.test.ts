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
import { mockTransactionResponse } from '../../../__fixtures__/data'
import { init, unset } from '../../../utils/config'
import {
  registerRoot,
  unRegisterRoot,
  register,
  unregister,
  registered,
  whoIs,
  rootName,
  nameToRoot,
  getSigningWalletNonce
} from '../index'
import { ethers, Wallet, Contract, utils } from 'ethers'
import { IDENTITY_ABI } from '../types'

const mockOrgName = 'testOrg'
const mockRootAddress = '0x706Fe724eA8F05928e5Fce8fAd5584061FE586ec'
const mockRegistered = jest.fn()
let config = init()

jest.mock('ethers', () => {
  const original = jest.requireActual('ethers')
  const originalUtils = jest.requireActual('ethers').utils
  const originalWallet = jest.requireActual('ethers').Wallet
  const originalContract = jest.requireActual('ethers').Contract

  return {
    ...original,
    utils: {
      ...originalUtils,
      defaultAbiCoder: {
        ...original.utils.defaultAbiCoder,
        encode: jest.fn().mockImplementation(() => '0x0123456789abcdef')
      }
    },
    Wallet: jest.fn().mockImplementation(() => ({
      ...originalWallet,
      address: mockRootAddress,
      providers: {
        JsonRpcProvider: jest.fn()
      }
    })),
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      /* code here */
    })),
    Contract: jest.fn().mockImplementation(() => ({
      ...originalContract,
      registerRoot: jest.fn().mockImplementation(() => mockTransactionResponse),
      unregisterRoot: jest
        .fn()
        .mockImplementation(() => mockTransactionResponse),
      register: jest.fn().mockImplementation(() => mockTransactionResponse),
      unregister: jest.fn().mockImplementation(() => mockTransactionResponse),
      registered: mockRegistered,
      nameToRoot: jest.fn().mockImplementation(() => mockRootAddress),
      rootName: jest.fn().mockImplementation(() => mockOrgName),
      whoIs: jest.fn().mockImplementation(() => mockRootAddress),
      nonces: jest.fn().mockImplementation(() => 1),
      eip712Domain: jest.fn().mockImplementation(() => ({
        name: 'Graph Protocol',
        version: '1',
        chainId: 8001,
        verifyingContract: '0x123456789abcdef'
      }))
    }))
  }
})

describe('identity functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should register root wallet and return transaction hash', async () => {
    const mockReceipt = await mockTransactionResponse.wait()
    const receipt = await registerRoot(mockOrgName)
    expect(Wallet).toHaveBeenCalledWith(
      config.rootPvtKey,
      new ethers.providers.JsonRpcProvider(config.rpcUrl)
    )

    expect(Wallet).toHaveBeenCalledWith(
      config.pvtKey,
      new ethers.providers.JsonRpcProvider(config.rpcUrl)
    )

    expect(Contract).toHaveBeenCalledWith(
      config.identityContractAddress,
      IDENTITY_ABI,
      expect.anything()
    )

    expect(JSON.stringify(receipt)).toBe(JSON.stringify(mockReceipt))
  })

  it('should un register root wallet and return transaction hash', async () => {
    const mockReceipt = await mockTransactionResponse.wait()
    const receipt = await unRegisterRoot()
    expect(Wallet).toHaveBeenCalledWith(
      config.rootPvtKey,
      new ethers.providers.JsonRpcProvider(config.rpcUrl)
    )

    expect(Wallet).toHaveBeenCalledWith(
      config.pvtKey,
      new ethers.providers.JsonRpcProvider(config.rpcUrl)
    )

    expect(Contract).toHaveBeenCalledWith(
      config.identityContractAddress,
      IDENTITY_ABI,
      expect.anything()
    )

    expect(JSON.stringify(receipt)).toBe(JSON.stringify(mockReceipt))
  })

  it('should fail register intermediate wallet if rootPvtKey is not set', async () => {
    unset('rootPvtKey')
    await expect(register()).rejects.toThrow(
      'rootPvtKey cannot be empty, either set and env var ROOT_PVT_KEY or pass a value to this function'
    )
    config = init()
  })

  it('should register intermediate wallet from config and return transaction hash', async () => {
    const mockReceipt = await mockTransactionResponse.wait()
    const receipt = await register()
    expect(Wallet).toHaveBeenCalledWith(
      config.rootPvtKey,
      new ethers.providers.JsonRpcProvider(config.rpcUrl)
    )

    expect(Wallet).toHaveBeenCalledWith(
      config.pvtKey,
      new ethers.providers.JsonRpcProvider(config.rpcUrl)
    )

    expect(Contract).toHaveBeenCalledWith(
      config.identityContractAddress,
      IDENTITY_ABI,
      expect.anything()
    )

    expect(utils.defaultAbiCoder.encode).toHaveBeenCalledWith(
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
        expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
        expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      ]
    )

    expect(JSON.stringify(receipt)).toBe(JSON.stringify(mockReceipt))
  })

  it('should unregister intermediate wallet picked from config and return transaction hash', async () => {
    const mockReceipt = await mockTransactionResponse.wait()
    const receipt = await unregister()

    expect(Wallet).toHaveBeenCalledWith(
      config.rootPvtKey,
      new ethers.providers.JsonRpcProvider(config.rpcUrl)
    )

    expect(Wallet).toHaveBeenCalledWith(
      config.pvtKey,
      new ethers.providers.JsonRpcProvider(config.rpcUrl)
    )

    expect(Contract).toHaveBeenCalledWith(
      config.identityContractAddress,
      IDENTITY_ABI,
      expect.anything()
    )

    expect(utils.defaultAbiCoder.encode).toHaveBeenCalledWith(
      ['bytes32', 'address', 'address', 'uint256', 'uint256', 'uint256'],
      [
        utils.keccak256(
          utils.toUtf8Bytes(
            'unregister(address root,address intermediate,uint256 nonce,uint256 chainID,uint256 deadline)'
          )
        ), //This is the hash of the register function type
        expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
        expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
        expect.anything(),
        expect.anything(),
        expect.anything()
      ]
    )

    expect(JSON.stringify(receipt)).toBe(JSON.stringify(mockReceipt))
  })

  it('should call registered with the correct address', async () => {
    const testAddress = '0x123456789abcdef'
    await registered(testAddress)
    expect(mockRegistered).toHaveBeenCalledWith(testAddress)
  })

  it('should return the result of registered', async () => {
    const testAddress = '0x123456789abcdef'
    mockRegistered.mockResolvedValue(true)
    const result = await registered(testAddress)
    expect(result).toBe(true)
  })

  it('should throw an error if registered throws an error', async () => {
    const testAddress = '0x123456789abcdef'
    mockRegistered.mockRejectedValue(new Error('Test error'))
    await expect(registered(testAddress)).rejects.toThrow('Test error')
  })

  it('should return root wallet for a registered intermediate wallet on whoIs', async () => {
    const testAddress = '0x123456789abcdef'
    await expect(whoIs(testAddress)).resolves.toBe(mockRootAddress)
    expect(Contract).toHaveBeenCalledWith(
      config.identityContractAddress,
      IDENTITY_ABI,
      expect.anything()
    )
  })

  it('should return org name for the root wallet address', async () => {
    await expect(rootName(mockRootAddress)).resolves.toBe(mockOrgName)
    expect(Contract).toHaveBeenCalledWith(
      config.identityContractAddress,
      IDENTITY_ABI,
      expect.anything()
    )
  })

  it('should return root wallet address for the org name', async () => {
    await expect(nameToRoot(mockOrgName)).resolves.toBe(mockRootAddress)
    expect(Contract).toHaveBeenCalledWith(
      config.identityContractAddress,
      IDENTITY_ABI,
      expect.anything()
    )
  })

  it('should return root nonce for signer wallet address', async () => {
    await expect(getSigningWalletNonce()).resolves.toBe(1)
    expect(Contract).toHaveBeenCalledWith(
      config.identityContractAddress,
      IDENTITY_ABI,
      expect.anything()
    )
  })

  it('should fail to get root nonce for signer wallet address if config is not set', async () => {
    unset('pvtKey')
    await expect(getSigningWalletNonce()).rejects.toThrow(
      'empty values found in config'
    )
    config = init()
  })
})
