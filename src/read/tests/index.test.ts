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
import { validateRequest, getImageData } from '../index'
import { SiweMessage } from 'siwe'
import fetchMock from 'jest-fetch-mock'

const mockVerify = jest.fn()

jest.mock('siwe', () => ({
  SiweMessage: jest.fn().mockImplementation(() => ({
    verify: mockVerify
  }))
}))

describe('validateRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should validate request and return message and address', async () => {
    const message = 'message'
    const signature = 'signature'
    mockVerify.mockResolvedValue({
      data: {
        statement: 'statement',
        address: 'address'
      }
    })
    const result = await validateRequest(message, signature)

    expect(result).toEqual({
      message: 'statement',
      address: 'address'
    })

    expect(SiweMessage).toHaveBeenCalledWith(message)
  })

  it('should return empty message if statement is not present', async () => {
    const message = 'message'
    const signature = 'signature'

    mockVerify.mockResolvedValue({
      data: {
        address: 'address'
      }
    })

    const result = await validateRequest(message, signature)

    expect(result).toEqual({
      message: '',
      address: 'address'
    })
  })
})

describe('getImageData', () => {
  beforeEach(() => {
    fetchMock.enableMocks()
  })

  afterEach(() => {
    fetchMock.resetMocks()
  })

  it('should throw an error if url is not passed', async () => {
    await expect(getImageData('')).rejects.toThrow('image url was not passed')
  })

  it('should fetch image data for given url', async () => {
    const url =
      'https://fastly.picsum.photos/id/270/800/900.jpg?hmac=sV_J_B7YYHDLBUVn9bqsMj1wv18GJIzoMvb84vrMYgY'
    const result = await getImageData(url)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(fetch).toHaveBeenCalledWith(url)
  })

  it('should return Uint8Array', async () => {
    const url =
      'https://fastly.picsum.photos/id/270/800/900.jpg?hmac=sV_J_B7YYHDLBUVn9bqsMj1wv18GJIzoMvb84vrMYgY'
    const result = await getImageData(url)
    expect(result).toBeInstanceOf(Uint8Array)
  })
})
