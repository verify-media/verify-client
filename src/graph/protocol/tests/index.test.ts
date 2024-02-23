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
  createArticleNode,
  createLicenseNode,
  createNode,
  getArticleProvenance,
  getAssetDetails,
  getContractInstance,
  getLegacyGas,
  getNode,
  getNodesCreated,
  getTokenToNode,
  getTotalSuppy,
  getWalletInstance,
  publish,
  publishBulk,
  publishRef,
  registerOrg,
  setAccessAuth,
  setReferenceAuth,
  setUri,
  verifyAsset
} from '../index'
import fetchMock from 'jest-fetch-mock'
import { GRAPH_V2_ABI, Node, NodeType } from '../types'
import { Wallet, Contract, ethers } from 'ethers'
import {
  mockTransactionResponse,
  mockHighGasPrice,
  mockLowGasPrice,
  mockNodeData,
  mockDefaultGasPrice,
  mockNodesCreated,
  PublishedAsset,
  mockAssetDetails,
  mockArticleProvenance
} from '../../../__fixtures__/data'
import { AssetNode, LocationProtocol, MIME_TYPES } from '../../../types/schema'
import { hashData } from '../../../utils/app'
import { IDENTITY_ABI } from '../../identity/types'

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
const mockNodesCreatedFn = jest.fn().mockImplementation(() => mockNodesCreated)
const mockGetNode = jest.fn().mockImplementation(() => mockNodeData)
const mockParentOf = jest.fn()
const mockChildrenOf = jest.fn()

jest.mock('ethers', () => {
  const original = jest.requireActual('ethers')

  return {
    ...original,
    utils: {
      ...jest.requireActual('ethers').utils,
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
      getNode: mockGetNode,
      totalSupply: jest.fn().mockImplementation(() => mockTotalSupply),
      tokenToNode: jest.fn().mockImplementation(() => mockNodeData),
      whoIs: jest.fn().mockImplementation(() => mockRootAddress),
      auth: jest.fn().mockImplementation(() => true),
      refAuth: jest.fn().mockImplementation(() => true),
      nodesCreated: mockNodesCreatedFn,
      parentOf: mockParentOf,
      childrenOf: mockChildrenOf,
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
    const nodesCreated = await getNodesCreated('xyz')
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

  test('should be able to call publishRef with correct parameters and return a transaction receipt', async () => {
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

    const receipt = await publishRef('1', params)

    expect(mockPublish).toHaveBeenCalledWith(
      '1',
      {
        id: params.id,
        nodeType: NodeType.REFERENCE,
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

  test('should be able to call createNode with nodeType and return a transaction receipt', async () => {
    const mockReceipt = { transactionHash: '0x123' }
    const node: Node = {
      id: '1',
      nodeType: NodeType.ORG,
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
  const mockPublishedAsset: AssetNode = {
    data: {
      description:
        'MFGzJ4dJf1f49WG2feOZhNd6bpRZT1zP1z1zObc1Jhn4XGHMiyApksdZ9c52',
      type: MIME_TYPES.TEXT,
      encrypted: true,
      access: {
        'lit-protocol': {
          ciphertext:
            'i/cQNEPrpc6tuhidGZvqZacedccbgcpp020fc77QdfhYXu/njeE7bb1K80QHewbJI50E33WMavYpIL4Y/N9dMhuiouvjwGjS3itRcXlS/g6tCTn6OK7O9DU0KsIzfZp0CHcOAMdiHE2DUpd8h1d0LIc0rv14A+vkV5hLYTdC8GeBdZbAaN34LDnWdVJzDdHKNIbFSKXanMgEk2urJHm99yVXAc/bKxg0B5kVzs+gKoo+6E+GcUbC6O114ZXNUncmtqEi9jZ9+0syZ46xoqek7Gb28iyqypz+UL6wxdGwwF7miZcbtRzmPAXP4tm6Zz0mh1FB1HUD5HvC3ANIM1zrfDT5OcCp6AokBzSp2d+DdZ3UGJ0K7NO5GBxIULFIGTF9inxxpda6jc8juWuttyvm0jMGxHdKOC6SROVCwmNSTvVaHyWc5l3b2U5kVWY4peMFcjsNsmFVZ7gN1j6y3jrF2kuKo165kGOh1L98kPiRY/4YeN+S8Z/nXUyA+cNcQ871xqcVxpjdrPiBGB8CwXF9KR9Z//VUgF7f2t0sWoCsB+8A0WSLo4UXrlKLoPXUiK/CFOG3YBETUkoW0GaH+rArdaMezrqfYtzm7FfUw079+LpcobqGdVa+JG0U+Oat/dMnZmVgrOWoRDXRIf4Ewvz1rH7mLUsOzXyC9CFeX1F9cjIMvzAUKJEVjW80yx1ksOl0uZPDg+xxXcnHHUxLGIvuxediwiLct4pIl6yz5Q17cnsVQcQkLxTrAlg0ziiWUQRBWa3HSPgsMsVN6UdTlIVVMPRuuwscJ0Xmo/Q4JEKMv5R1O5lsourboihLeCO4F2QsDuPXW4wWQb1v3t/SphHl+4gM69ficjvgVpFRZa9nZGY3rZOB8k0Xk88AP7RBktOxwTdBPxMy1vWxCWvNJBQCHIe/jBtkWgxeROBr2W8ynOYjGoOxdftSx4pq7yi0C8RY5LAbY8OyVhZfWtV+YbY6VENhDqSrbIiRL69nH9LFIRjQp/+nJi/tIgQznjRCf2acrGdXPOZgRqYQoMGHJBjokznBn35UZDlHIzWTvOlIksHpxmmyq9/Wm0vUontwVWhUTYkSb/6HAhUrZvKTWN189wTYQnATv9ReqjCm4jO+6mFgAZ6C3YTrTHM7Z5cfvHih85iTetqOUvhASA1zwNuHOQw7FhivMG/wPEG+yDfwSd/psRFkNw3yAhGOpp1NW3b+F/kvwTaRunA46Y15C1day2nuBBhyQSZQFC6KcyFH9wGCMkwYiHldS6IWA6fvYI3k81Qa4BTiZ1xbgikFlMAuyOX3o6mpa9Q5BdHHh9FlwMPs0j1Rluk0gepKTnGUhiiVIDXjFY9ZCAgO6CzIH67rf6bonBoRBOWefC3D8X2Oe8AHuXDkb7xsdMd1PTnfzSIWnG8qrqXApbFGLL+sK6MWQuazpeI0Z0mKrgxVJheE0oet625IlnK3KxRDHIXznBfaWI7yd1QAPv42wwQriNG8YbThqmBT9CjXt9jhMZXNaEiWOhpywTL9a8JkK74351Bl8n2JGKa8exPFgy+8Y/2CmZbXzU0K9eK7giVJAnef2036QVTZXurmc57Fj24a71ic8dWUkWLEYTVfBMPh/vZ53/3FtLkDHDa62QRWc7ACoAFFUJKHIrSuGmnZVkJnwb+PNXDyHIJFTOXmRMtgKwoL69uBc8h31zMdSN58UslJ4QM='
        }
      },
      locations: [
        {
          uri: 'ipfs://bafkreiga4gbrp3urpjql6pim6s75qbnn5t2xxowixn7qw2v4jc2l6jalhq',
          protocol: LocationProtocol.IPFS
        }
      ],
      manifest: {
        uri: 'https://www.verifymedia.com/',
        title: 'i1ah87534EpxIE3JSoFd27UAgdFomF',
        alt: '',
        description:
          'MFGzJ4dJf1f49WG2feOZhNd6bpRZT1zP1z1zObc1Jhn4XGHMiyApksdZ9c52',
        caption: '',
        creditedSource: 'ORG_ABC',
        signingOrg: { name: 'ORG_ABC', unit: 'ORG_ABC' },
        published: '2024-02-23T10:33:05.236Z'
      },
      contentBinding: {
        algo: 'keccak256',
        hash: '0x9b9e2b890d1776d62b60409661c5c3a2afa056d604e42d93375cf78b5d06563a'
      },
      history: []
    },
    signature: {
      curve: 'sepc256k1',
      signature:
        '0x03e0ece988b8fcb5caf5dbe2b006fec787aa4989171667939116d80e03e0a98b36e5be33bfd57f7e819aa1d8a6e888971d5f807bc751c5cf1388574f6ab277581b',
      message:
        '0x78b81f82484a2f88113231671db59952d4d33b0bf9136242343a35d56820de89',
      description:
        'hex encoded sepc256k1 signature of the keccak256 hash of content field with the signers private key'
    }
  }
  const assetId = PublishedAsset.data.contentBinding.hash
  const asset = PublishedAsset
  // mockRecoverAddress.mockImplementation(() => mockAddress)
  // mockKecak256.mockImplementation(() => asset.signature.message)

  // TODO update this example with new example for PublishedAsset
  test('should verify the asset signature and content binding', async () => {
    const validity = await verifyAsset(
      mockPublishedAsset.data.contentBinding.hash,
      mockPublishedAsset
    )

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

describe('registerOrg', () => {
  it('creates org and og nodes and returns their ids and transaction hashes', async () => {
    const rootWalletAddress = '0x123'
    const mockHash = 'mockHash'
    const orgTransaction = { transactionHash: 'orgTransactionHash' }
    const ogTransaction = { transactionHash: 'ogTransactionHash' }
    const solidityKeccak256Spy = jest
      .spyOn(ethers.utils, 'solidityKeccak256')
      .mockReturnValue(mockHash)

    mockCreateNode.mockImplementationOnce(() => ({
      wait: jest.fn().mockResolvedValueOnce(orgTransaction)
    }))
    mockCreateNode.mockImplementationOnce(() => ({
      wait: jest.fn().mockResolvedValueOnce(ogTransaction)
    }))
    const result = await registerOrg(rootWalletAddress)

    expect(result).toEqual({
      org: {
        id: mockHash,
        txnHash: orgTransaction.transactionHash
      },
      originalMaterial: {
        id: mockHash,
        txnHash: ogTransaction.transactionHash
      }
    })
    expect(mockNodesCreatedFn).toHaveBeenCalledTimes(3)
    expect(solidityKeccak256Spy).toHaveBeenCalledTimes(2)
    expect(solidityKeccak256Spy).toHaveBeenCalledWith(
      ['address', 'uint256'],
      [rootWalletAddress, '2']
    )
    expect(mockCreateNode).toHaveBeenCalledTimes(3)
  })
})

describe('createLicenseNode', () => {
  it('creates a license node if passed parameters are valid', async () => {
    const mockTransaction = { transactionHash: 'orgTransactionHash' }

    mockCreateNode.mockImplementationOnce(() => ({
      wait: jest.fn().mockResolvedValueOnce(mockTransaction)
    }))

    await createLicenseNode('getty', '0x1234')

    expect(mockGetNode).toHaveBeenCalled()
    expect(mockCreateNode).toHaveBeenCalled()
  })
})

describe('createArticleNode', () => {
  it('creates an article node if passed parameters are valid', async () => {
    const mockTransaction = { transactionHash: 'orgTransactionHash' }

    mockCreateNode.mockImplementationOnce(() => ({
      wait: jest.fn().mockResolvedValueOnce(mockTransaction)
    }))

    const origin = 'fox'
    const articleId = 'article123'
    const nodeId = await createArticleNode(origin, articleId, '0x1234')

    expect(mockGetNode).toHaveBeenCalled()
    expect(mockCreateNode).toHaveBeenCalled()
    const _nodeId = hashData(`${origin}${articleId}`)
    expect(nodeId).toBe(_nodeId)
  })
})

const mockConfig = {
  pinataKey: '',
  pinataSecret: ''
}

describe('getAssetDetails', () => {
  beforeEach(() => {
    fetchMock.enableMocks()
  })

  it('is able to fetch asset details and hierarchy with an assetId as input and pinata as ipfs service', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(PublishedAsset))
    mockParentOf.mockImplementationOnce(() => '1')
    mockParentOf.mockImplementationOnce(() => '0')
    const assetDetails = await getAssetDetails('0x1234', '', mockConfig)
    expect(fetchMock).toHaveBeenCalled()
    expect(mockParentOf).toHaveBeenCalled()
    expect(JSON.stringify(assetDetails)).toBe(JSON.stringify(mockAssetDetails))
  })

  it('is able to fetch asset details and hierarchy with an assetId as input with a self hosted ipfs gateway', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(PublishedAsset))
    mockParentOf.mockImplementationOnce(() => '1')
    mockParentOf.mockImplementationOnce(() => '0')
    const assetDetails = await getAssetDetails('0x1234', 'https://ipfsgateway/')
    expect(fetchMock).toHaveBeenCalled()
    expect(mockParentOf).toHaveBeenCalled()
    expect(JSON.stringify(assetDetails)).toBe(JSON.stringify(mockAssetDetails))
  })
})

describe('getArticleProvenance', () => {
  beforeEach(() => {
    fetchMock.enableMocks()
  })

  it('is able to fetch article provenance if articleId is passed and pinata as ipfs service', async () => {
    fetchMock.mockResponse(JSON.stringify(PublishedAsset))
    mockChildrenOf.mockImplementationOnce(() => ['1', '2', '3'])
    const result = await getArticleProvenance('article123', '', mockConfig)
    expect(fetchMock).toHaveBeenCalled()
    expect(mockChildrenOf).toHaveBeenCalled()
    expect(mockChildrenOf).toHaveBeenCalled()
    expect(JSON.stringify(result)).toBe(JSON.stringify(mockArticleProvenance))
  })

  it('is able to fetch article provenance if articleId is passed and self hosted ipfs gateway', async () => {
    fetchMock.mockResponse(JSON.stringify(PublishedAsset))
    mockChildrenOf.mockImplementationOnce(() => ['1', '2', '3'])
    const result = await getArticleProvenance(
      'article123',
      'https://ipfsgateway/'
    )
    expect(fetchMock).toHaveBeenCalled()
    expect(mockChildrenOf).toHaveBeenCalled()
    expect(mockChildrenOf).toHaveBeenCalled()
    expect(JSON.stringify(result)).toBe(JSON.stringify(mockArticleProvenance))
  })
})

it('should instantiate contract when pvtKey is set and kmsId is not set', async () => {
  await getContractInstance()

  expect(Wallet).toHaveBeenCalledWith(
    config.pvtKey,
    new ethers.providers.JsonRpcProvider(config.rpcUrl)
  )

  expect(Contract).toHaveBeenCalledWith(
    config.identityContractAddress,
    IDENTITY_ABI,
    expect.anything()
  )
})
