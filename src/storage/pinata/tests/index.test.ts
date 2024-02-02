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
import fetchMock from 'jest-fetch-mock'
import { fetchFromIPFS, testPinataConnection, uploadToIPFS } from '../index'
import { UploadRequest } from '../../ipfs/types'
import { mockEmptyEnvVars } from '../../../__fixtures__/env'
import { PublishedAsset } from '../../../__fixtures__/data'
import { hashImage, hash as rawHash } from '../../../write'
import { init } from '../../../utils/config'

init({
  stage: '',
  pvtKey: '',
  rpcUrl: '',
  chainId: 0,
  chain: '',
  walletExpiryDays: 1
})

const imageUrl =
  'https://a57.foxnews.com/prod-hp.foxnews.com/images/2023/11/1254/706/c4a9aeca1db2222b40c30c0fd7a398fc.jpg?tl=1&ve=1'

const pinataConfig = {
  root: 'https://api.pinata.cloud',
  headers: {
    pinata_api_key: '',
    pinata_secret_api_key: ''
  }
}

const mockConfig = {
  pinataKey: '',
  pinataSecret: ''
}

const mockData: UploadRequest = {
  name: 'mockBodyName',
  body: PublishedAsset
}

describe('testPinataConnection function', () => {
  beforeEach(() => {
    fetchMock.enableMocks()
  })

  afterEach(() => {
    fetchMock.resetMocks()
  })

  it('should call fetch with the correct url and options when env vars are set', async () => {
    const mockResponseData = { data: 'mockData' }
    fetchMock.mockResponseOnce(JSON.stringify(mockResponseData))

    await testPinataConnection(mockConfig)

    expect(fetchMock).toHaveBeenCalledWith(
      `${pinataConfig.root}/data/testAuthentication`,
      {
        method: 'GET',
        headers: pinataConfig.headers
      }
    )
  })

  it('should call fetch with the correct url and options when env vars are not set', async () => {
    const mockResponseData = { data: 'mockData' }
    fetchMock.mockResponseOnce(JSON.stringify(mockResponseData))

    mockConfig.pinataKey = 'mockPinataKey'
    mockConfig.pinataSecret = 'mockPinataSecret'
    const originalEnv = { ...process.env }

    mockEmptyEnvVars()

    await testPinataConnection(mockConfig)

    expect(fetchMock).toHaveBeenCalledWith(
      `${pinataConfig.root}/data/testAuthentication`,
      {
        method: 'GET',
        headers: {
          pinata_api_key: mockConfig.pinataKey,
          pinata_secret_api_key: mockConfig.pinataSecret
        }
      }
    )
    process.env = originalEnv
  })

  it('should return "success" when the fetch call succeeds', async () => {
    const mockResponseData = { data: 'mockData' }
    fetchMock.mockResponseOnce(JSON.stringify(mockResponseData))

    const result = await testPinataConnection(mockConfig)

    expect(result).toBe('success')
  })

  it('should throw an error when the fetch call fails', async () => {
    fetchMock.mockRejectOnce(new Error('fetch error'))

    await expect(testPinataConnection(mockConfig)).rejects.toThrow(
      'fetch error'
    )
  })
})

describe('uploadToIPFS function', () => {
  beforeEach(() => {
    fetchMock.enableMocks()
  })

  afterEach(() => {
    fetchMock.resetMocks()
  })

  it('should return the response data when the fetch call succeeds for type meta', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        IpfsHash: 'mockIpfsHash',
        PinSize: 1,
        Timestamp: 'mockTimestamp'
      })
    )

    mockData.name = 'mockFileName1'
    const result = await uploadToIPFS({
      data: mockData,
      config: mockConfig,
      type: 'meta'
    })

    expect(result?.IpfsHash).not.toEqual('')
  })

  it('should return the response data when the fetch call succeeds for type non meta', async () => {
    mockData.name = 'mockFileName2'
    const buffer = await fetch(imageUrl).then((res) => res.arrayBuffer())
    const content = new Uint8Array(Buffer.from(buffer))
    mockData.body = content

    fetchMock.mockResponseOnce(
      JSON.stringify({
        IpfsHash: 'mockIpfsHash',
        PinSize: 1,
        Timestamp: 'mockTimestamp'
      })
    )

    const result = await uploadToIPFS({
      data: mockData,
      config: mockConfig,
      type: 'file'
    })

    expect(result?.IpfsHash).not.toEqual('')
  })

  it('should throw an error on uploadToIPFS when the fetch call fails', async () => {
    fetchMock.enableMocks()
    fetchMock.mockRejectedValue(new Error('fetch error'))
    mockEmptyEnvVars()
    await expect(
      uploadToIPFS({ data: mockData, config: mockConfig, type: 'file' })
    ).rejects.toThrow(Error)
  })
})

describe('fetchFromIPFS function', () => {
  beforeEach(() => {
    fetchMock.enableMocks()
  })

  it('should return the uploaded data when the fetch call succeeds for type non meta', async () => {
    const result = await fetchFromIPFS(
      'bafkreietiyihc5o6klsndpyhv2j7lpxqfstbjbtyphlafwemxz6reczhse',
      'file'
    )
    const imageHash = await hashImage(imageUrl)
    const expectedHash = rawHash(result as Uint8Array)
    expect(imageHash).toEqual(expectedHash)
  })

  it('should return the uploaded data when the fetch call succeeds for type meta', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        IpfsHash: 'mockIpfsHash',
        PinSize: 1,
        Timestamp: 'mockTimestamp'
      })
    )

    const result = await fetchFromIPFS(
      'bafkreiezu2gp5eprrw7rr54qmwwhs33k5elf42dwea2i7o3bpcwuohc7hm',
      'meta'
    )
    expect(JSON.stringify(result)).toEqual(
      JSON.stringify({
        IpfsHash: 'mockIpfsHash',
        PinSize: 1,
        Timestamp: 'mockTimestamp'
      })
    )
  })
})
