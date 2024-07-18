/* istanbul ignore file */

import { UploadRequest } from './ipfs/types'
import { CID } from 'multiformats/cid'
import { sha256 } from 'multiformats/hashes/sha2'

/**
 * generates CID (Version 1) for data (without uploading anything to IPFS)
 * @param data of type {@link UploadRequest} for which cid needs to be generated
 * @returns <Promise<string>} CID of the data
 */
export const genCid = async (data: UploadRequest): Promise<string> => {
  const hash = await sha256.digest(data.body as Uint8Array)
  const cid = CID.create(1, 0x55, hash) // 0x55 is the code for raw multicodec

  return cid.toString()
}
