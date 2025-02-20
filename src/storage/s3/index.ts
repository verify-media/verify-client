import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import { AssetNode } from '../../types/schema'
import { debugLogger } from '../../utils/logger'
import { S3Config, UploadToS3Params } from './types'
import { EncryptedContent } from '../ipfs/types'
import { genCid } from '..'

export const uploadToS3 = async ({
  data,
  config,
  type
}: UploadToS3Params): Promise<{ key: string } | null> => {
  const { accessKeyId, secretAccessKey, region, bucketName } = config
  const { name, body } = data
  const s3Client = new S3Client({
    region,
    credentials:
      accessKeyId && secretAccessKey
        ? {
            accessKeyId,
            secretAccessKey
          }
        : undefined
  })
  const key = await genCid(data)
  debugLogger().debug(`Generated key: ${key} for ${name} and type is ${type}`)
  try {
    if (type === 'meta') {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: `${key}`,
          Body: JSON.stringify(body)
        })
      )
      debugLogger().debug('Uploaded meta to S3', name)

      return { key: `${key}` }
    } else {
      const requestBody = prepareBody(body)
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: `${key}`,
          Body: requestBody
        })
      )

      return { key: `${key}` }
    }
  } catch (error) {
    debugLogger().error(error)
    throw new Error('failed to upload to S3')
  }
}

export const fetchFromS3 = async (
  key: string,
  config: S3Config,
  type: string
): Promise<AssetNode | Uint8Array | null> => {
  const { accessKeyId, secretAccessKey, region, bucketName } = config

  const s3Client = new S3Client({
    credentials:
      accessKeyId && secretAccessKey
        ? {
            accessKeyId,
            secretAccessKey
          }
        : undefined,
    region
  })

  try {
    debugLogger().debug(`Fetching from S3: ${key}`)
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key
      })
    )
    if (!response.Body) {
      throw new Error('No data returned from S3')
    }

    if (type === 'meta') {
      if (!response.Body) {
        throw new Error('No data returned from S3')
      }
      const dataString = await response.Body.transformToString()
      const data = JSON.parse(dataString) as AssetNode
      debugLogger().debug(data)

      return data
    } else {
      const data = new Uint8Array(response.Body as unknown as Buffer)
      debugLogger().debug(`Fetched ${data.length} bytes`)

      return data
    }
  } catch (error) {
    debugLogger().error(error)
    if (error instanceof SyntaxError) {
      throw new Error(`JSON Parsing Error: ${error.message}`)
    }
    throw error
  }
}

const prepareBody = (
  body: Uint8Array | AssetNode | EncryptedContent
): string | Uint8Array => {
  if (body instanceof Uint8Array) {
    return body
  } else if ('ciphertext' in body) {
    // Handle EncryptedContent
    return JSON.stringify(body)
  } else {
    // Handle AssetNode
    return JSON.stringify(body)
  }
}
