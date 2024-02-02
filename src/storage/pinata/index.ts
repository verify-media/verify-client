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
import { PinataConfig, PinataPinResponse, UploadToPinataParams } from './types'
import { AssetNode } from '../../types/schema'
import { Readable } from 'stream'
import NodeFormData from 'form-data'

/**
 * Configuration object for the Pinata API.
 * @type {Object}
 * @property {string} root - The root URL of the Pinata API.
 * @property {Object} headers - The headers to include in API requests.
 * @property {string} headers.pinata_api_key - The Pinata API key.
 * @property {string} headers.pinata_secret_api_key - The Pinata secret API key.
 */
const pinataConfig = {
  root: 'https://api.pinata.cloud',
  headers: {
    pinata_api_key: '',
    pinata_secret_api_key: ''
  }
}

/**
 * Uploads data to IPFS via the Pinata API.
 *
 * @async
 * @function uploadToIPFS
 * @param {UploadToPinataParams} params - The parameters for the upload.
 * @returns {Promise<PinataPinResponse | null>} A promise that resolves with the response from Pinata, or null if an error occurred.
 * @throws Will throw an error if the upload fails.
 */
export const uploadToIPFS = async ({
  data,
  config,
  type
}: UploadToPinataParams): Promise<PinataPinResponse | null> => {
  try {
    const { name, body } = data
    const { pinataKey, pinataSecret } = config
    pinataConfig.headers.pinata_api_key = pinataKey || ''
    pinataConfig.headers.pinata_secret_api_key = pinataSecret || ''

    let pinataResp = null

    if (type === 'meta') {
      const asset = body as AssetNode

      const requestBody = {
        pinataContent: asset,
        pinataMetadata: {
          name
        },
        pinataOptions: {
          cidVersion: 1
        }
      }

      const endpoint = `${pinataConfig.root}/pinning/pinJSONToIPFS`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: pinataConfig.headers.pinata_api_key,
          pinata_secret_api_key: pinataConfig.headers.pinata_secret_api_key
        },
        body: JSON.stringify(requestBody)
      })

      pinataResp = await response.json()
    } else {
      //TODO add validation on body type
      const endpoint = `${pinataConfig.root}/pinning/pinFileToIPFS`
      const formData = new NodeFormData()

      const stream = new Readable({
        read() {
          this.push(body)
          this.push(null)
        }
      })

      formData.append('file', stream, {
        filename: name
      })

      formData.append(
        'pinataMetadata',
        JSON.stringify({
          name
        })
      )

      formData.append(
        'pinataOptions',
        JSON.stringify({
          cidVersion: 1
        })
      )

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          pinata_api_key: pinataConfig.headers.pinata_api_key,
          pinata_secret_api_key: pinataConfig.headers.pinata_secret_api_key,
          'Content-type': `multipart/form-data; boundary=${formData.getBoundary()}`
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        body: formData
      })

      pinataResp = await response.json()
    }

    return pinataResp as PinataPinResponse
  } catch (error) {
    throw new Error((error as Error).message)
  }
}

/**
 * Tests the connection to the Pinata API.
 *
 * @async
 * @function testPinataConnection
 * @param {PinataConfig} config - The configuration for the Pinata API.
 * @returns {Promise<string>} A promise that resolves with the string 'success' if the connection is successful.
 * @throws Will throw an error if the connection test fails.
 * @hidden
 */
export const testPinataConnection = async (
  config: PinataConfig
): Promise<string> => {
  const { pinataKey, pinataSecret } = config
  pinataConfig.headers.pinata_api_key = pinataKey || ''
  pinataConfig.headers.pinata_secret_api_key = pinataSecret || ''
  const url = `${pinataConfig.root}/data/testAuthentication`
  const response = await fetch(url, {
    method: 'GET',
    headers: pinataConfig.headers
  })
  await response.json()

  return 'success'
}

/**
 * Fetches a file from IPFS via the Pinata gateway.
 *
 * @async
 * @function fetchFromIPFS
 * @param {string} cid - The CID of the file to fetch.
 * @param {string} type - The type of the file ('meta' for JSON and 'asset' for binary data).
 * @returns {Promise<string | Uint8Array>} A promise that resolves with the file data as a string or a Uint8Array.
 * @throws Will throw an error if the fetch fails.
 */
export const fetchFromIPFS = async (
  cid: string,
  type: string
): Promise<AssetNode | Uint8Array | null> => {
  const url = `https://gateway.pinata.cloud/ipfs/${cid}`
  const response = await fetch(url)
  let data: AssetNode | Uint8Array | null = null
  if (type === 'meta') {
    data = await response.json()
    data
  } else {
    const resp = await response.arrayBuffer()
    data = new Uint8Array(resp)
  }

  return data
}
