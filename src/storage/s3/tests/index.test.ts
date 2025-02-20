import { fetchFromS3, uploadToS3 } from '../index'
import { S3Config } from '../types'
import { PublishedAsset } from '../../../__fixtures__/data'
import { init } from '../../../utils/config'
import { mockClient } from 'aws-sdk-client-mock'
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import { Readable } from 'node:stream'
import { sdkStreamMixin } from '@smithy/util-stream'
import { UploadRequest } from '../../ipfs/types'
import { genCid } from '../..'

init({
  stage: '',
  pvtKey: '',
  rpcUrl: '',
  chainId: 0,
  chain: '',
  walletExpiryDays: 1
})

const s3Config: S3Config = {
  bucketName: 'test-bucket',
  accessKeyId: 'test-access-key',
  secretAccessKey: 'test-secret-key',
  region: 'test-region'
}
const s3ClientMock = mockClient(S3Client)
const mockData: UploadRequest = {
  name: 'mockBodyName',
  body: PublishedAsset
}

describe('uploadToS3', () => {
  beforeEach(() => {
    s3ClientMock.reset()
  })

  afterEach(() => {})

  it('should upload data to S3 and return the key', async () => {
    const key = `${await genCid(mockData)}`
    s3ClientMock.on(PutObjectCommand).resolves({})
    const result = await uploadToS3({
      data: mockData,
      config: s3Config,
      type: 'meta'
    })

    expect(result?.key).toEqual(key)
  })

  it('should handle errors during upload', async () => {
    // Mock the S3 upload logic to throw an error
    s3ClientMock.on(PutObjectCommand).rejects(new Error('S3 upload error'))

    await expect(
      uploadToS3({
        data: mockData,
        config: s3Config,
        type: 'meta'
      })
    ).rejects.toThrow('failed to upload to S3')
  })
})

describe('fetchFromS3', () => {
  beforeEach(() => {
    s3ClientMock.reset()
  })

  afterEach(() => {})

  it('should fetch data from S3 and return the content', async () => {
    const mockData = { msg: 'hello world' }
    const stream = Readable.from([JSON.stringify(mockData)]) // Create a readable stream
    const sdkStream = sdkStreamMixin(stream) // Convert to SDK-compatible stream
    s3ClientMock.on(GetObjectCommand).resolves({ Body: sdkStream })

    const result = await fetchFromS3('test-key', s3Config, 'meta')

    expect(result).toEqual(mockData)
  })

  it('should handle errors during download', async () => {
    // Mock the S3 download logic to throw an error
    s3ClientMock.on(GetObjectCommand).rejects(new Error('S3 download error'))

    await expect(fetchFromS3('test-key', s3Config, 'meta')).rejects.toThrow(
      'S3 download error'
    )
  })
  it('should handle corrupted JSON data', async () => {
    const stream = Readable.from(['\u0000\u0000\u0000']) // Invalid JSON
    const sdkStream = sdkStreamMixin(stream)
    s3ClientMock.on(GetObjectCommand).resolves({ Body: sdkStream })
    await expect(fetchFromS3('test-key', s3Config, 'meta')).rejects.toThrow(
      /JSON Parsing Error/
    )
  })
})
