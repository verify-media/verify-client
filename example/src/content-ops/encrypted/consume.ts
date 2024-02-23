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
  AssetNode,
  verifyAsset,
  decryptAsset
} from '@verify-media/verify-client'
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
  const asset = (await fetchFileFromPinata(
    assetNode.uri,
    'meta',
    pinataConfig
  )) as AssetNode
  if (!asset.data.access || !asset.data.access['lit-protocol']) {
    throw new Error('asset is not encrypted')
  }

  const litProtocol: {
    ciphertext: string
  } | null = asset.data.access ? asset.data.access['lit-protocol'] : null

  const assetUri = asset.data.locations.filter((location) => {
    return location.protocol === 'ipfs'
  })[0].uri

  console.log(`fetching actual asset from ipfs @ ${assetUri}`)

  const dataToEncryptHash = await fetchFileFromPinata(
    assetUri,
    'asset',
    pinataConfig
  )

  if (asset.data.type === 'text/html') {
    const decoder = new TextDecoder()
    const _dataToEncryptHash = decoder.decode(dataToEncryptHash as Uint8Array)
    const decryptedAsset = await decryptAsset({
      ciphertext:
        litProtocol && litProtocol.ciphertext ? litProtocol.ciphertext : '',
      dataToEncryptHash: _dataToEncryptHash,
      contentHash: asset.data.contentBinding.hash
    })
    const decryptedString = decoder.decode(decryptedAsset as Uint8Array)
    console.log('decryptedString ===> ', decryptedString)
  } else {
    const decoder = new TextDecoder()
    const _dataToEncryptHash = decoder.decode(dataToEncryptHash as Uint8Array)
    const decryptedAsset = await decryptAsset({
      ciphertext:
        litProtocol && litProtocol.ciphertext ? litProtocol.ciphertext : '',
      dataToEncryptHash: _dataToEncryptHash,
      contentHash: asset.data.contentBinding.hash
    })
    const buffer = Buffer.from(decryptedAsset)
    // Write buffer to a file
    fs.writeFile('output.jpg', buffer, (err) => {
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
