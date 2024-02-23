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
import {
  getNode,
  init,
  fetchFileFromPinata,
  verifyAsset,
  AssetNode
} from '@verifymedia/client'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

init()

async function consumeContent(assetId: string): Promise<{
  signatureVerified: boolean
  contentBindingVerified: boolean
  signer: string
  root: string
}> {
  const pinataConfig = {
    pinataKey: process.env.PINATA_KEY || '',
    pinataSecret: process.env.PINATA_SECRET || ''
  }
  console.log('fetching details for assetId: ', assetId)
  const assetNode = await getNode(assetId)
  console.log(`fetching asset meta from ipfs @ ${assetNode.uri}`)
  const assetMeta = (await fetchFileFromPinata(
    assetNode.uri,
    'meta',
    pinataConfig
  )) as AssetNode
  const asset = assetMeta
  const assetUri = asset.data.locations.filter((location) => {
    return location.protocol === 'ipfs'
  })[0].uri
  console.log(`fetching actual asset from ipfs @ ${assetUri}`)

  if (asset.data.type === 'text/html') {
    const assetBody = await fetchFileFromPinata(assetUri, 'asset', pinataConfig)
    const decoder = new TextDecoder()
    const decryptedString = decoder.decode(assetBody as Uint8Array)
    console.log('decryptedString ===> ', decryptedString)
  } else {
    const assetBody = (await fetchFileFromPinata(
      assetUri,
      'asset',
      pinataConfig
    )) as Uint8Array
    const buffer = Buffer.from(assetBody)
    // Write buffer to a file
    fs.writeFile('output-unencrypted.jpg', buffer, (err) => {
      if (err) throw err
      console.log('The file has been saved!')
    })
  }

  console.log('verifying asset')
  const verified = await verifyAsset(assetId, asset)
  console.log('asset verified:')

  return verified
}

const input = process.argv[2]

if (!input) {
  console.error('Please provide an asset id')
  process.exit(1)
}

console.log(await consumeContent(input))
