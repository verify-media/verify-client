/* istanbul ignore file */

import { IPFSConfig, UploadRequest } from './ipfs/types'
import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'
import { PinataConfig } from './pinata/types'
import { S3Config } from './s3/types'
import { debugLogger } from '../utils/logger'
import { AssetNode } from '../types/schema'
import { fetchFromIPFS, uploadToIPFS } from './ipfs'
import {
  fetchFromIPFS as fetchFromPinata,
  uploadToIPFS as uploadToPinata
} from './pinata'
import { fetchFromS3, uploadToS3 } from './s3'
import { encode as cborEncoder } from 'cbor2'

/**
 * generates CID (Version 1) for data (without uploading anything to IPFS)
 * @param data of type {@link UploadRequest} for which cid needs to be generated
 * @returns <Promise<string>} CID of the data
 */
export const genCid = async (data: UploadRequest): Promise<string> => {
  const binaryData: Uint8Array =
    data.body instanceof Uint8Array ? data.body : cborEncoder(data.body)
  const hash = await sha256.digest(binaryData)
  const cid = CID.create(1, 0x55, hash) // 0x55 is the code for raw multicodec

  return cid.toString()
}

/**
 *
 * @param data data to be uploaded can be a file or metadata
 * @param config configuration for the data store
 * @param type type of data to be uploaded meta or file
 * @param dataStore ipfs, pinata or s3
 * @returns cid/key of the uploaded data
 */
export const uploadData = async (
  data: UploadRequest,
  config: IPFSConfig | PinataConfig | S3Config,
  type: string,
  dataStore: 'ipfs' | 'pinata' | 's3'
): Promise<string> => {
  debugLogger().info(`uploading data to ${dataStore} with type ${type}`)
  try {
    switch (dataStore) {
      case 'ipfs': {
        const response = await uploadToIPFS({
          data,
          config: config as IPFSConfig,
          type
        })
        if (!response || !response.cid) {
          debugLogger().error('failed to upload to IPFS', response)
          throw new Error('failed to upload to IPFS')
        }

        return response.cid
      }
      case 'pinata': {
        const response = await uploadToPinata({
          data,
          config: config as PinataConfig,
          type
        })
        if (!response || !response.IpfsHash) {
          debugLogger().error('failed to upload to IPFS', response)
          throw new Error('failed to upload to IPFS')
        }

        return response.IpfsHash
      }
      case 's3': {
        const response = await uploadToS3({
          data,
          config: config as S3Config,
          type
        })
        if (!response || !response.key) {
          debugLogger().error('failed to upload to S3', response)
          throw new Error('failed to upload to S3')
        }

        return response.key
      }
      default:
        throw new Error('invalid data store')
    }
  } catch (error) {
    debugLogger().error(`failed to upload data to ${dataStore}`, error)
    throw new Error(`failed to upload data to ${dataStore}`)
  }
}

/**
 *
 * @param key cid for ipfs and key for s3 stored data
 * @param type meta or file
 * @param url gateway url for ipfs and bucket name for s3
 * @param metadataStore ipfs or s3
 * @param config required for s3 and pinata
 * @returns {Promise<string | Uint8Array>} A promise that resolves with the file data as a string or a Uint8Array.
 */
export const fetchData = async (
  key: string,
  type: string,
  metadataStore: 'ipfs' | 'pinata' | 's3' = 'ipfs',
  config?: IPFSConfig | PinataConfig | S3Config
): Promise<AssetNode | Uint8Array | null> => {
  debugLogger().info(
    `fetching data for key ${key} from ${metadataStore} with type ${type}`
  )
  switch (metadataStore) {
    case 'ipfs':
      return await fetchFromIPFS(key, type, (config as IPFSConfig).rpcUri)
    case 'pinata': {
      const { pinataKey, pinataSecret } = config as PinataConfig
      if (!pinataKey || !pinataSecret) {
        throw new Error('pinata key and secret are required')
      }

      return await fetchFromPinata(key, type, config as PinataConfig)
    }
    case 's3':
      return await fetchFromS3(key, config as S3Config, type)
  }
}
