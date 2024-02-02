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
import { init } from '../../../utils/config'
import {
  changeParent,
  checkAuth,
  checkGasgLimits,
  checkRefAuth,
  createNode,
  getContractInstance,
  getLegacyGas,
  getNode,
  getNodesCreated,
  getTokenToNode,
  getTotalSuppy,
  getWalletInstance,
  publish,
  publishBulk,
  setAccessAuth,
  setReferenceAuth,
  setUri,
  verifyAsset
} from '../index'
import { GRAPH_V2_ABI, Node, NodeType } from '../types'
import { Wallet, Contract, ethers } from 'ethers'
import {
  mockTransactionResponse,
  mockHighGasPrice,
  mockLowGasPrice,
  mockNodeData,
  mockDefaultGasPrice,
  mockNodesCreated,
  PublishedAsset
} from '../../../__fixtures__/data'
import { AssetNode } from '../../../types/schema'

const config = init({
  stage: '',
  pvtKey: '',
  rpcUrl: '',
  chainId: 0,
  chain: '',
  maxGasPrice: 2000000000000,
  walletExpiryDays: 1
})

const mockTotalSupply = 500
const mockAddress = '0x123'
const mockRootAddress = '0x706Fe724eA8F05928e5Fce8fAd5584061FE586ec'
const mockGasPrice = jest.fn()
const mockWait = jest.fn()
const mockPublish = jest.fn()
const mockCreateNode = jest.fn()
const mockPublishBulk = jest.fn()

jest.mock('ethers', () => {
  const original = jest.requireActual('ethers')

  return {
    ...original,
    utils: {
      verifyMessage: jest.fn().mockImplementation(() => mockAddress)
    },
    Wallet: jest.fn().mockImplementation(() => ({
      provider: {
        getGasPrice: mockGasPrice
      }
    })),
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      /* Mock properties and methods here */
    })),
    Contract: jest.fn().mockImplementation(() => ({
      getNode: jest.fn().mockImplementation(() => mockNodeData),
      totalSupply: jest.fn().mockImplementation(() => mockTotalSupply),
      tokenToNode: jest.fn().mockImplementation(() => mockNodeData),
      whoIs: jest.fn().mockImplementation(() => mockRootAddress),
      auth: jest.fn().mockImplementation(() => true),
      refAuth: jest.fn().mockImplementation(() => true),
      nodesCreated: jest.fn().mockImplementation(() => mockNodesCreated),
      publish: mockPublish.mockImplementation(() => ({
        wait: mockWait
      })),
      publishBulk: mockPublishBulk.mockImplementation(() => ({
        wait: mockWait
      })),
      createNode: mockCreateNode.mockImplementation(() => ({
        wait: mockWait
      })),
      move: jest.fn().mockImplementation(() => mockTransactionResponse),
      setAccessAuth: jest
        .fn()
        .mockImplementation(() => mockTransactionResponse),
      setReferenceAuth: jest
        .fn()
        .mockImplementation(() => mockTransactionResponse),
      setURI: jest.fn().mockImplementation(() => mockTransactionResponse)
    }))
  }
})

describe('graph functions', () => {
  test('should be able to get a wallet instance', async () => {
    const wallet = await getWalletInstance()
    expect(Wallet).toHaveBeenCalledWith(
      config.pvtKey,
      new ethers.providers.JsonRpcProvider(config.rpcUrl)
    )
    expect(wallet).toBeDefined()
  })

  test('should be able to get a contract instance', async () => {
    const contract = await getContractInstance()
    expect(Wallet).toHaveBeenCalledWith(
      config.pvtKey,
      new ethers.providers.JsonRpcProvider(config.rpcUrl)
    )
    expect(Contract).toHaveBeenCalledWith(
      config.contractAddress,
      GRAPH_V2_ABI,
      expect.anything()
    )
    expect(contract).toBeDefined()
  })

  test('should be able to get legacy gas price for the network', async () => {
    mockGasPrice.mockImplementationOnce(() => Promise.resolve(mockLowGasPrice))
    const gas = await getLegacyGas()
    expect(gas).toBe(mockLowGasPrice)
  })

  test('should fail if legacy gas is greater than maxgas set in config', async () => {
    mockGasPrice.mockImplementationOnce(() => Promise.resolve(mockHighGasPrice))

    await expect(checkGasgLimits()).rejects.toThrow(
      'Gas limit exceeded as mentioned in config'
    )
  })

  test('should not fail if legacy gas is lower than maxgas set in config', async () => {
    mockGasPrice.mockImplementationOnce(() => Promise.resolve(mockLowGasPrice))
    await expect(checkGasgLimits()).resolves.toBe(mockLowGasPrice)
  })

  test('should pick default gas price if a fetch from network fails', async () => {
    mockGasPrice.mockImplementationOnce(() => Promise.resolve(null))
    const gas = await getLegacyGas()
    expect(gas.toString()).toBe(mockDefaultGasPrice.toString())
  })

  test('should be able to call totalSupply', async () => {
    const totalSupply = await getTotalSuppy()
    expect(Wallet).toHaveBeenCalledWith(
      config.pvtKey,
      new ethers.providers.JsonRpcProvider(config.rpcUrl)
    )

    expect(Contract).toHaveBeenCalled()

    expect(totalSupply).toBe(mockTotalSupply)
  })

  test('should be able to call getNodesCreated', async () => {
    const nodesCreated = await getNodesCreated()
    expect(Wallet).toHaveBeenCalledWith(
      config.pvtKey,
      new ethers.providers.JsonRpcProvider(config.rpcUrl)
    )

    expect(Contract).toHaveBeenCalledWith(
      config.contractAddress,
      GRAPH_V2_ABI,
      expect.anything()
    )

    expect(nodesCreated).toBe(mockNodesCreated)
  })

  test('should be able to call getNode', async () => {
    const node = await getNode('1')
    expect(Wallet).toHaveBeenCalledWith(
      config.pvtKey,
      new ethers.providers.JsonRpcProvider(config.rpcUrl)
    )

    expect(Contract).toHaveBeenCalledWith(
      config.contractAddress,
      GRAPH_V2_ABI,
      expect.anything()
    )

    expect(JSON.stringify(node)).toBe(JSON.stringify(mockNodeData))
  })

  test('should be able to call set uri', async () => {
    mockGasPrice.mockImplementationOnce(() => Promise.resolve(mockLowGasPrice))
    const mockReceipt = await mockTransactionResponse.wait()
    const receipt = await setUri('1', 'ipfs://location')
    expect(Wallet).toHaveBeenCalledWith(
      config.pvtKey,
      new ethers.providers.JsonRpcProvider(config.rpcUrl)
    )

    expect(Contract).toHaveBeenCalledWith(
      config.contractAddress,
      GRAPH_V2_ABI,
      expect.anything()
    )

    expect(JSON.stringify(receipt)).toBe(JSON.stringify(mockReceipt))
  })

  test('should fail set uri if the legacy gas price is higher than configured max gas price', async () => {
    mockGasPrice.mockImplementationOnce(() => Promise.resolve(mockHighGasPrice))
    await expect(setUri('1', 'ipfs://location')).rejects.toThrow(
      'Gas limit exceeded as mentioned in config'
    )

    expect(Wallet).toHaveBeenCalledWith(
      config.pvtKey,
      new ethers.providers.JsonRpcProvider(config.rpcUrl)
    )

    expect(Contract).toHaveBeenCalledWith(
      config.contractAddress,
      GRAPH_V2_ABI,
      expect.anything()
    )
  })

  test('should be able to call publish with correct parameters and return a transaction receipt', async () => {
    const mockReceipt = { transactionHash: '0x123' }
    const params = {
      id: '1',
      uri: 'ipfs://location',
      referenceOf: '0'
    }
    mockGasPrice.mockImplementationOnce(() =>
      Promise.resolve(mockDefaultGasPrice)
    )
    mockWait.mockImplementationOnce(() => Promise.resolve(mockReceipt))

    const receipt = await publish('1', params)

    expect(mockPublish).toHaveBeenCalledWith(
      '1',
      {
        id: params.id,
        nodeType: NodeType.ASSET,
        referenceOf: params.referenceOf,
        uri: params.uri
      },
      {
        gasPrice: mockDefaultGasPrice
      }
    )

    expect(mockWait).toHaveBeenCalled()
    expect(receipt).toBe(mockReceipt)
  })

  test('should be able to call publishBulk with correct parameters and return a transaction receipt', async () => {
    const mockReceipt = { transactionHash: '0x123' }
    const params = [
      {
        id: '1',
        uri: 'ipfs://location',
        referenceOf: '0'
      },
      {
        id: '2',
        uri: 'ipfs://location2',
        referenceOf: '2'
      }
    ]

    mockGasPrice.mockImplementationOnce(() =>
      Promise.resolve(mockDefaultGasPrice)
    )
    mockWait.mockImplementationOnce(() => Promise.resolve(mockReceipt))

    const receipt = await publishBulk('1', params)

    expect(mockPublishBulk).toHaveBeenCalledWith(
      '1',
      [
        {
          id: params[0].id,
          nodeType: NodeType.ASSET,
          referenceOf: params[0].referenceOf,
          uri: params[0].uri
        },
        {
          id: params[1].id,
          nodeType: NodeType.ASSET,
          referenceOf: params[1].referenceOf,
          uri: params[1].uri
        }
      ],
      {
        gasPrice: mockDefaultGasPrice
      }
    )

    expect(mockWait).toHaveBeenCalled()
    expect(receipt).toBe(mockReceipt)
  })

  test('should be able to call createNode with nodeType and return a transaction receipt', async () => {
    const mockReceipt = { transactionHash: '0x123' }
    const node: Node = {
      id: '1',
      nodeType: NodeType.ADMIN,
      parentId: '0',
      referenceOf: ''
    }

    mockGasPrice.mockImplementationOnce(() =>
      Promise.resolve(mockDefaultGasPrice)
    )
    mockWait.mockImplementationOnce(() => Promise.resolve(mockReceipt))

    const receipt = await createNode(node)
    expect(Wallet).toHaveBeenCalledWith(
      config.pvtKey,
      new ethers.providers.JsonRpcProvider(config.rpcUrl)
    )

    expect(mockCreateNode).toHaveBeenCalledWith(
      node.id,
      node.parentId,
      node.nodeType,
      node.referenceOf,
      {
        gasPrice: mockDefaultGasPrice
      }
    )

    expect(mockWait).toHaveBeenCalled()
    expect(receipt).toBe(mockReceipt)
  })

  test('should be able to call changeParent', async () => {
    mockGasPrice.mockImplementationOnce(() =>
      Promise.resolve(mockDefaultGasPrice)
    )
    const mockReceipt = await mockTransactionResponse.wait()
    const receipt = await changeParent('1', '0')
    expect(Wallet).toHaveBeenCalledWith(
      config.pvtKey,
      new ethers.providers.JsonRpcProvider(config.rpcUrl)
    )

    expect(Contract).toHaveBeenCalledWith(
      config.contractAddress,
      GRAPH_V2_ABI,
      expect.anything()
    )

    expect(JSON.stringify(receipt)).toBe(JSON.stringify(mockReceipt))
  })

  test('should be able to call setAccessAuth', async () => {
    mockGasPrice.mockImplementationOnce(() =>
      Promise.resolve(mockDefaultGasPrice)
    )
    const mockReceipt = await mockTransactionResponse.wait()
    const receipt = await setAccessAuth('1', 'addr1')
    expect(Wallet).toHaveBeenCalledWith(
      config.pvtKey,
      new ethers.providers.JsonRpcProvider(config.rpcUrl)
    )

    expect(Contract).toHaveBeenCalledWith(
      config.contractAddress,
      GRAPH_V2_ABI,
      expect.anything()
    )

    expect(JSON.stringify(receipt)).toBe(JSON.stringify(mockReceipt))
  })
})

test('should be able to call setReferenceAuth', async () => {
  mockGasPrice.mockImplementationOnce(() =>
    Promise.resolve(mockDefaultGasPrice)
  )
  const mockReceipt = await mockTransactionResponse.wait()
  const receipt = await setReferenceAuth('1', 'addr1')
  expect(Wallet).toHaveBeenCalledWith(
    config.pvtKey,
    new ethers.providers.JsonRpcProvider(config.rpcUrl)
  )

  expect(Contract).toHaveBeenCalledWith(
    config.contractAddress,
    GRAPH_V2_ABI,
    expect.anything()
  )

  expect(JSON.stringify(receipt)).toBe(JSON.stringify(mockReceipt))
})

test('should be able to checkAuth', async () => {
  mockGasPrice.mockImplementationOnce(() =>
    Promise.resolve(mockDefaultGasPrice)
  )
  const isAuthorised = await checkAuth('1', 'addr1')
  expect(Wallet).toHaveBeenCalledWith(
    config.pvtKey,
    new ethers.providers.JsonRpcProvider(config.rpcUrl)
  )

  expect(Contract).toHaveBeenCalledWith(
    config.contractAddress,
    GRAPH_V2_ABI,
    expect.anything()
  )

  expect(isAuthorised).toBe(true)
})

test('should be able to checkRefAuth', async () => {
  mockGasPrice.mockImplementationOnce(() =>
    Promise.resolve(mockDefaultGasPrice)
  )
  const isAuthorised = await checkRefAuth('1', 'addr1')
  expect(Wallet).toHaveBeenCalledWith(
    config.pvtKey,
    new ethers.providers.JsonRpcProvider(config.rpcUrl)
  )

  expect(Contract).toHaveBeenCalledWith(
    config.contractAddress,
    GRAPH_V2_ABI,
    expect.anything()
  )

  expect(isAuthorised).toBe(true)
})

test('should be able to getTokenToNode', async () => {
  mockGasPrice.mockImplementationOnce(() =>
    Promise.resolve(mockDefaultGasPrice)
  )
  const node = await getTokenToNode(1)
  expect(Wallet).toHaveBeenCalledWith(
    config.pvtKey,
    new ethers.providers.JsonRpcProvider(config.rpcUrl)
  )

  expect(Contract).toHaveBeenCalledWith(
    config.contractAddress,
    GRAPH_V2_ABI,
    expect.anything()
  )

  expect(node).toBe(mockNodeData)
})

describe('verifyAsset function', () => {
  const assetId = PublishedAsset.data.contentBinding.hash
  const asset: AssetNode = PublishedAsset
  // mockRecoverAddress.mockImplementation(() => mockAddress)
  // mockKecak256.mockImplementation(() => asset.signature.message)

  test('should verify the asset signature and content binding', async () => {
    const validity = await verifyAsset(assetId, asset)

    expect(validity.signatureVerified).toBe(true)
    expect(validity.contentBindingVerified).toBe(true)
    expect(validity.signer).toBe(mockAddress)
    expect(validity.root).toBe(mockRootAddress)
  })

  test('should not verify the asset signature if the calculated message does not match', async () => {
    const differentAsset: AssetNode = {
      ...asset,
      signature: {
        ...asset.signature,
        message: 'differentMessage'
      }
    }

    const validity = await verifyAsset(assetId, differentAsset)
    expect(validity.signatureVerified).toBe(false)
  })

  test('should not verify the content binding if the assetId does not match the hash', async () => {
    const differentAsset: AssetNode = asset
    differentAsset.data.contentBinding.hash = 'differentHash'

    const validity = await verifyAsset(assetId, differentAsset)

    expect(validity.contentBindingVerified).toBe(false)
  })
})
