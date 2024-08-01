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
import { IPFSResponse, UploadToIPFSParams } from './types'
import fetch, { Headers } from 'node-fetch'
import { debugLogger } from '../../utils/logger'
import { AssetNode } from '../../types/schema'
import { ensureIPFS } from '../../utils/app'
import NodeFormData from 'form-data'
import { Readable } from 'stream'

//TODO explore https://github.com/ipfs/js-kubo-rpc-client
/**
 * Uploads data to the InterPlanetary File System (IPFS). One can setup their own IPFS node or use a service like [kubo](https://docs.ipfs.tech/install/command-line/).
 * @param { UploadToIPFSParams } - params of type The parameters for the upload operation. This includes the data to upload, the configuration for the IPFS, and the type of the data.
 * @returns { IPFSResponse } A promise that resolves with the response of type from the IPFS if the upload is successful, or null if the upload fails.
 *
 * @example
 * const response = await uploadToIPFS({ data: myData, config: myConfig, type: 'meta' })
 */
/* istanbul ignore next */
export const uploadToIPFS = async ({
  data,
  config,
  type
}: UploadToIPFSParams): Promise<IPFSResponse | null> => {
  const { rpcUri, creds } = config
  const { name, body } = data
  const auth = Buffer.from(creds).toString('base64')
  const headers = new Headers()
  let response = null

  headers.set('Authorization', 'Basic ' + auth)
  headers.set('Accept', 'application/json')

  debugLogger().debug('headers set')

  debugLogger().debug(`uploading to ${rpcUri}`)
  if (type === 'meta') {
    const formData = new NodeFormData()
    //TODO add validation on body type
    debugLogger().debug('uploading meta')
    formData.append('file-upload', JSON.stringify(body))
    debugLogger().debug(JSON.stringify(body))

    response = await fetch(rpcUri, {
      method: 'POST',
      body: formData,
      headers
    })

    debugLogger().debug(JSON.stringify(response))
  } else {
    const formData = new NodeFormData()
    //TODO add validation on body type
    debugLogger().debug('uploading file')
    const stream = new Readable({
      read() {
        this.push(body)
        this.push(null)
      }
    })

    debugLogger().debug('append stream')

    formData.append('file', stream, {
      filename: name
    })

    debugLogger().debug('make fetch request')

    response = await fetch(rpcUri, {
      method: 'POST',
      body: formData,
      headers
    })
  }

  debugLogger().debug(JSON.stringify(response))

  if (!response.ok) {
    throw new Error('failed to upload to IPFS')
  }

  const responseData = await response.json()

  debugLogger().debug(JSON.stringify(responseData))

  if (!(responseData as IPFSResponse)?.cid) {
    throw new Error('failed to upload to IPFS')
  }

  return responseData as IPFSResponse
}

/**
 * Fetches a file from IPFS and returns it as an `AssetNode` or `Uint8Array`. One can setup their own IPFS node or use a service like [kubo](https://docs.ipfs.tech/install/command-line/).
 *
 * @param {string} cid - The CID of the file to fetch.
 * @param {string} type - The type of the file to fetch. If 'meta', the file is treated as JSON and parsed into an `AssetNode`. Otherwise, the file is treated as binary data and returned as a `Uint8Array`.
 * @param {string} ipfsGateway - The URL of the IPFS gateway to use.
 * @returns {Promise<AssetNode | Uint8Array | null>} A promise that resolves with the fetched file as an `AssetNode` or `Uint8Array`, or `null` if the file could not be fetched.
 *
 * @throws {Error} If the CID is not provided, the IPFS gateway is not provided, or the file cannot be fetched.
 */
export const fetchFromIPFS = async (
  cid: string,
  type: string,
  ipfsGateway: string
): Promise<AssetNode | Uint8Array | null> => {
  debugLogger().debug(cid)
  if (!ipfsGateway) throw new Error('IPFS gateway is not provided')
  const _cid = ensureIPFS(cid).split('ipfs://')[1]
  const url = `${ipfsGateway}/${_cid}`
  debugLogger().debug(url)
  const response = await fetch(url)
  debugLogger().debug(response)
  let data: AssetNode | Uint8Array | null = null
  if (type === 'meta') {
    data = (await response.json()) as AssetNode
    debugLogger().debug(data)
  } else {
    const resp = await response.arrayBuffer()
    data = new Uint8Array(resp)
    debugLogger().debug(data.length)
  }

  return data
}
