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
import {
  hashData,
  hashImage,
  signAssetNode,
  signRequest,
  submitRequest,
  buildAssetPayload,
  addEncryptionData,
  addIPFSData,
  addSignatureData
} from '../index'
import { assetNode, mockArticle } from '../../__fixtures__/data'
import { mockEnvVars } from '../../__fixtures__/env'
import { init, unset } from '../../utils/config'
import fetchMock from 'jest-fetch-mock'
import { Wallet } from 'ethers'
import { LocationProtocol, Signature } from '../../types/schema'

let config = init()

jest.mock('ethers', () => {
  const original = jest.requireActual('ethers')
  const originalWallet = jest.requireActual('ethers').Wallet

  return {
    ...original,
    Wallet: jest.fn().mockImplementation(() => ({
      ...originalWallet,
      address: '0x706Fe724eA8F05928e5Fce8fAd5584061FE586ec',
      signMessage: jest.fn().mockImplementation(() => 'mockSignature'),
      providers: {
        JsonRpcProvider: jest.fn()
      }
    })),
    JsonRpcProvider: jest.fn()
  }
})

describe('write functions', () => {
  beforeEach(() => {
    fetchMock.enableMocks()
  })

  afterEach(() => {
    fetchMock.resetMocks()
  })

  mockEnvVars()

  init({
    stage: '',
    pvtKey: '',
    rpcUrl: '',
    chainId: 0,
    chain: '',
    walletExpiryDays: 1
  })

  test('it generates a hash for given string value', () => {
    expect(hashData('some string')).not.toBe('')
  })

  test('it throws an error if input value is falsy', () => {
    let message = ''
    try {
      hashData('')
    } catch (e) {
      expect(e instanceof Error).toBe(true)
      if (e instanceof Error) {
        message = e.message
      }
    } finally {
      expect(message).toBe('no value passed was passed')
    }
  })

  test('it throws an error if image url is not passed', async () => {
    let message = ''
    try {
      await hashImage('')
    } catch (e) {
      expect(e instanceof Error).toBe(true)
      if (e instanceof Error) {
        message = e.message
      }
    } finally {
      expect(message).toBe('image url was not passed')
    }
  })

  test('it generates a hash for given image url', async () => {
    const imageUrl =
      'https://fastly.picsum.photos/id/270/800/900.jpg?hmac=sV_J_B7YYHDLBUVn9bqsMj1wv18GJIzoMvb84vrMYgY'
    const hash = await hashImage(imageUrl)
    expect(hash).not.toBe('')
  })

  test('it generates same hash for given image event if called multiple times', async () => {
    const imageUrl =
      'https://fastly.picsum.photos/id/270/800/900.jpg?hmac=sV_J_B7YYHDLBUVn9bqsMj1wv18GJIzoMvb84vrMYgY'
    const hash = await hashImage(imageUrl)
    const hash2 = await hashImage(imageUrl)
    expect(hash).toBe(hash2)
  })

  test('it generates signature for the assetnode', async () => {
    const sign = await signAssetNode(assetNode)
    expect(sign.message).toBe(hashData(JSON.stringify(assetNode)))
  })

  test('it throws error if asset has encrypted property true but ciphertext is absent', async () => {
    assetNode.access && (assetNode.access['lit-protocol'].ciphertext = '')
    await expect(signAssetNode(assetNode)).rejects.toThrow(
      'encrypted asset is missing ciphertext'
    )
  })

  test('it throws error if asset node is invalid', async () => {
    assetNode.description = ''
    await expect(signAssetNode(assetNode)).rejects.toThrow(
      '"description" is not allowed to be empty'
    )
  })
})

describe('signRequest function', () => {
  it('should return a signature', async () => {
    const origin = 'test origin'
    const result = await signRequest(origin)
    expect(result).not.toBe('')

    expect(Wallet).toHaveBeenCalledWith(config.rootPvtKey)
  })

  it('should throw error if config is not set', async () => {
    const origin = 'test origin'
    unset('rootPvtKey')
    await expect(signRequest(origin)).rejects.toThrow(
      'rootPvtKey cannot be empty, either set and env var ROOT_PVT_KEY or pass a value to this function'
    )
    config = init()
  })
})

describe('submitRequest', () => {
  beforeEach(() => {
    fetchMock.enableMocks()
  })

  afterEach(() => {
    fetchMock.resetMocks()
  })

  it('should call signRequest with correct arguments and update body.message', async () => {
    const article = mockArticle
    const origin = 'test-origin'

    fetchMock.mockResponseOnce(
      JSON.stringify({
        traceId: 'test traceId',
        message: 'test response message'
      })
    )

    const result = await submitRequest(article, origin)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][1]?.method).toBe('POST')
    expect(result.message).toBe('test response message')
    expect(result.traceId).toBe('test traceId')
  })

  it('should throw error if signRequest fails', async () => {
    const article = mockArticle
    const origin = 'test-origin'

    fetchMock.mockRejectOnce(new Error('signRequest error'))

    await expect(submitRequest(article, origin)).rejects.toThrow(
      'signRequest error'
    )
  })
})

const assetHash = '0x0000000'

describe('buildAssetPayload', () => {
  it('should return an AssetNode object with default values', () => {
    const asset = buildAssetPayload(assetHash)

    expect(asset).toEqual({
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
          hash: '0x0000000'
        }
      },
      signature: {
        curve: 'secp256k1',
        signature: '',
        message: '',
        description: ''
      }
    })
  })

  it('should return an AssetNode object with encrypted set to true', () => {
    const asset = buildAssetPayload(assetHash)

    expect(asset.data.encrypted).toBe(true)
  })

  it('should return an AssetNode object with contentBinding algo set to keccak256', () => {
    const asset = buildAssetPayload(assetHash)

    expect(asset.data.contentBinding.algo).toBe('keccak256')
  })

  it('should return an AssetNode object with contentBinding hash set to assetHash', () => {
    const asset = buildAssetPayload(assetHash)

    expect(asset.data.contentBinding.hash).toBe(assetHash)
  })

  it('should return an AssetNode object with signature curve set to secp256k1', () => {
    const asset = buildAssetPayload(assetHash)

    expect(asset.signature.curve).toBe('secp256k1')
  })
})

describe('addEncryptionData', () => {
  it('should add encryption data to an AssetNode object', () => {
    const asset = buildAssetPayload(assetHash)
    const encryptedAsset = {
      ciphertext: 'encryptedData',
      dataToEncryptHash: 'dataToEncryptHash'
    }

    const updatedAsset = addEncryptionData(asset, encryptedAsset)

    expect(updatedAsset.data.access).toEqual({
      'lit-protocol': {
        ciphertext: 'encryptedData'
      }
    })
  })

  it('should not modify other properties of the AssetNode object', () => {
    const asset = buildAssetPayload(assetHash)
    asset.data.description = 'Test description'
    const encryptedAsset = {
      ciphertext: 'encryptedData',
      dataToEncryptHash: 'dataToEncryptHash'
    }

    const updatedAsset = addEncryptionData(asset, encryptedAsset)

    expect(updatedAsset.data.description).toBe('Test description')
  })

  it('should overwrite existing encryption data', () => {
    const asset = buildAssetPayload(assetHash)
    asset.data.access = {
      'lit-protocol': {
        ciphertext: 'oldEncryptedData'
      }
    }
    const encryptedAsset = {
      ciphertext: 'newEncryptedData',
      dataToEncryptHash: 'dataToEncryptHash'
    }

    const updatedAsset = addEncryptionData(asset, encryptedAsset)

    expect(updatedAsset.data.access).toEqual({
      'lit-protocol': {
        ciphertext: 'newEncryptedData'
      }
    })
  })
})

describe('addIPFSData', () => {
  const assetHash = '0x0000000'

  it('should add IPFS data to an AssetNode object', () => {
    const asset = buildAssetPayload(assetHash)
    const IpfsHash = 'QmT78zSuBmuS4z925WZfrqQ1qHaJ56DQaTfyMUF7F8ff5o'

    const updatedAsset = addIPFSData(asset, IpfsHash)

    expect(updatedAsset.data.locations).toEqual([
      {
        uri: IpfsHash,
        protocol: 'ipfs'
      }
    ])
  })

  it('should not modify other properties of the AssetNode object', () => {
    const asset = buildAssetPayload(assetHash)
    asset.data.description = 'Test description'
    const IpfsHash = 'QmT78zSuBmuS4z925WZfrqQ1qHaJ56DQaTfyMUF7F8ff5o'

    const updatedAsset = addIPFSData(asset, IpfsHash)

    expect(updatedAsset.data.description).toBe('Test description')
  })

  it('should add IPFS data to existing locations in the AssetNode object', () => {
    const asset = buildAssetPayload(assetHash)
    asset.data.locations.push({
      uri: 'existingUri',
      protocol: LocationProtocol.IPFS
    })
    const IpfsHash = 'QmT78zSuBmuS4z925WZfrqQ1qHaJ56DQaTfyMUF7F8ff5o'

    const updatedAsset = addIPFSData(asset, IpfsHash)

    expect(updatedAsset.data.locations).toEqual([
      {
        uri: 'existingUri',
        protocol: 'ipfs'
      },
      {
        uri: IpfsHash,
        protocol: 'ipfs'
      }
    ])
  })
})

describe('addSignatureData', () => {
  it('should add signature data to an AssetNode object', () => {
    const asset = buildAssetPayload(assetHash)
    const signature = {
      message: 'test message',
      signature: 'test signature',
      curve: 'secp256k1',
      description: 'test description'
    }

    const updatedAsset = addSignatureData(asset, signature)

    expect(updatedAsset.signature).toEqual(signature)
  })

  it('should not modify other properties of the AssetNode object', () => {
    const asset = buildAssetPayload(assetHash)
    asset.data.description = 'Test description'
    const signature: Signature = {
      message: 'test message',
      signature: 'test signature',
      curve: 'secp256k1',
      description: 'test description'
    }

    const updatedAsset = addSignatureData(asset, signature)

    expect(updatedAsset.data.description).toBe('Test description')
  })

  it('should overwrite existing signature in the AssetNode object', () => {
    const asset = buildAssetPayload(assetHash)
    asset.signature = {
      message: 'old message',
      signature: 'old signature',
      curve: 'secp256k1',
      description: 'old description'
    }
    const signature = {
      message: 'new message',
      signature: 'new signature',
      curve: 'secp256k1',
      description: 'new description'
    }

    const updatedAsset = addSignatureData(asset, signature)

    expect(updatedAsset.signature).toEqual(signature)
  })
})
