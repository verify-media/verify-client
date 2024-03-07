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
  buildAssetPayload,
  addEncryptionData,
  addIPFSData,
  addSignatureData,
  buildArticleBody
} from '../index'
import { assetNode } from '../../__fixtures__/data'
import { mockEnvVars } from '../../__fixtures__/env'
import { init } from '../../utils/config'
import fetchMock from 'jest-fetch-mock'

import {
  Article,
  Content,
  ContentTypes,
  LocationProtocol,
  MIME_TYPES,
  Signature
} from '../../types/schema'
import { ensureIPFS } from '../../utils/app'

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

  test('it throws error if asset has encrypted property true but version is absent', async () => {
    assetNode.access && (assetNode.access['lit-protocol'].version = '')
    await expect(signAssetNode(assetNode)).rejects.toThrow(
      'encrypted asset is missing version'
    )
  })

  test('it throws error if asset node is invalid', async () => {
    assetNode.description = ''
    await expect(signAssetNode(assetNode)).rejects.toThrow(
      '"description" is not allowed to be empty'
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
        },
        history: []
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

    const updatedAsset = addEncryptionData(asset)

    expect(updatedAsset.data.access).toEqual({
      'lit-protocol': {
        version: 'v3'
      }
    })
  })

  it('should not modify other properties of the AssetNode object', () => {
    const asset = buildAssetPayload(assetHash)
    asset.data.description = 'Test description'
    const updatedAsset = addEncryptionData(asset)

    expect(updatedAsset.data.description).toBe('Test description')
  })

  it('should overwrite existing encryption data', () => {
    const asset = buildAssetPayload(assetHash)
    asset.data.access = {
      'lit-protocol': {
        version: 'v3'
      }
    }

    const updatedAsset = addEncryptionData(asset)

    expect(updatedAsset.data.access).toEqual({
      'lit-protocol': {
        version: 'v3'
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
        uri: ensureIPFS(IpfsHash),
        protocol: 'ipfs'
      }
    ])
  })

  it('should throw an error if ipfsHash is empty', () => {
    const asset = buildAssetPayload(assetHash)
    const IpfsHash = ''
    try {
      addIPFSData(asset, IpfsHash)
    } catch (error) {
      expect((error as Error).message).toBe('ipfs hash cannot be empty')
    }
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
        uri: ensureIPFS(IpfsHash),
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

describe('buildArticleBody', () => {
  it('builds the XML body of an article', () => {
    const otherContents: Array<Content & { hash: string }> = [
      {
        title: 'Image Title',
        contentType: MIME_TYPES.JPEG,
        description: 'Image Description',
        creditedSource: 'Image Source',
        hash: 'imageHash',
        type: ContentTypes.IMAGE, // replace with actual type
        uri: 'https://example.com/image', // replace with actual URI
        id: 'imageId', // replace with actual ID
        authority: { name: 'Image Authority', contact: 'contact@example.com' }, // replace with actual authority
        published: new Date().toISOString(), // replace with actual published date
        ownership: 'owned',
        metadata: {}
      }
    ]

    const article: Article = {
      metadata: {
        title: 'Article Title',
        description: 'Article Description',
        datePublished: '2022-01-01',
        id: 'articleId',
        uri: 'https://example.com/article',
        origin: 'Publisher Name',
        dateCreated: '',
        dateUpdated: '',
        authority: {
          name: '',
          contact: ''
        }
      },
      contents: otherContents
    }
    const articleBody = 'Article Body'

    const result = buildArticleBody(article, articleBody, otherContents)

    expect(result).toContain('<title>Article Title</title>')
    expect(result).toContain('<description>Article Description</description>')
    expect(result).toContain('<datePublished>2022-01-01</datePublished>')
    expect(result).toContain('<id>articleId</id>')
    expect(result).toContain(
      '<canonicalUrl>https://example.com/article</canonicalUrl>'
    )
    expect(result).toContain('<publishedBy>Publisher Name</publishedBy>')
    expect(result).toContain(
      '<section>\n        Article Body\n      </section>'
    )
    expect(result).toContain('<title>Image Title</title>')
    expect(result).toContain('<contentType>image/jpeg</contentType>')
    expect(result).toContain('<description>Image Description</description>')
    expect(result).toContain('<creditedSource>Image Source</creditedSource>')
    expect(result).toContain('<hash>imageHash</hash>')
  })
})
