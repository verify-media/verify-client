import { UploadRequest } from '../../ipfs/types'

export type S3Config = {
  accessKeyId: string
  secretAccessKey: string
  region: string
  bucketName: string
}
export type UploadToS3Params = {
  data: UploadRequest
  config: S3Config
  type: string // 'meta' or 'file'
}
