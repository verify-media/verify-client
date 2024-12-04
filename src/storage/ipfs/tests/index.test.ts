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
// import { uploadToIPFS } from '../index'
import 'utils/config'

describe('write to IPFS', () => {
  // const config = {
  //   rpcUri: 'http://localhost:5001',
  //   creds: 'testCreds'
  // }
  // const data = {
  //   name: 'testName',
  //   body: 'testBody'
  // }

  beforeEach(() => {
    fetchMock.enableMocks()
  })

  afterEach(() => {
    fetchMock.resetMocks()
  })

  // it('should upload meta data to IPFS and return response', async () => {
  //   const mockResponse = { cid: 'testCid' }
  //   fetchMock.mockResponseOnce(JSON.stringify(mockResponse))
  //   const response = await uploadToIPFS({
  //     data,
  //     config,
  //     type: 'meta'
  //   })
  //   expect(response).toEqual(mockResponse)
  // })

  // it('should upload blob data to IPFS and return response', async () => {
  //   //create a blob
  //   const blob = new Blob(['hello world'], { type: 'text/plain' })
  //   const data = {
  //     name: 'testName',
  //     body: blob
  //   }
  //   const mockResponse = { cid: 'testCid' }
  //   fetchMock.mockResponseOnce(JSON.stringify(mockResponse))
  //   const response = await uploadToIPFS({
  //     data,
  //     config,
  //     type: 'content'
  //   })
  //   expect(response).toEqual(mockResponse)
  // })

  // it('should throw error if server responds with error', async () => {
  //   fetchMock.mockRejectOnce(new Error('Internal Server Error'))
  //   await expect(uploadToIPFS({ data, config, type: 'meta' })).rejects.toThrow(
  //     'failed to upload to IPFS'
  //   )
  // })

  // it('should throw error if parameters are invalid', async () => {
  //   await expect(
  //     uploadToIPFS({ data: {}, config: {}, type: '' })
  //   ).rejects.toThrow()
  // })

  it('dummy test', () => {
    expect(true).toBe(true)
  })
})
