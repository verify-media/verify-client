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
  signAssetNode,
  hashData,
  init,
  uploadToPinata,
  publish,
  getImageData,
  hashImage,
  encryptAsset,
  buildAssetPayload,
  addEncryptionData,
  addIPFSData,
  addSignatureData
} from '@verify-media/verify-client'
import dotenv from 'dotenv'

dotenv.config()

init()

// test string
function generateRandomString(len: number): string {
  let result = ''
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i: number = 0; i < len; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }

  return result
}

async function publishText(): Promise<string> {
  console.log('publishing encrypted text')
  const text = generateRandomString(100)
  console.log('text ===> ', text)
  const blob = new Blob([text], { type: 'text/plain' })
  const hash = hashData(text)
  console.log('assetId ===> ', hash)

  let asset = buildAssetPayload(hash)
  asset.data.description = 'sandbox sample string'
  asset.data.type = 'text/html'
  asset.data.encrypted = false
  asset.data.manifest.uri = 'https://verifymedia.com'
  asset.data.manifest.title = 'sandbox sample title'
  asset.data.manifest.creditedSource = 'verifymedia'
  asset.data.manifest.signingOrg.name = 'FOX'
  asset.data.manifest.signingOrg.unit = 'FOX'
  asset.data.manifest.published = new Date().toISOString()

  console.log('encrypting text asset using lit-protocol')
  //encrypt
  const encryptedAsset = await encryptAsset({
    content: blob,
    contentHash: hash
  })
  console.log('encrypted text asset using lit-protocol')

  asset = addEncryptionData(asset)

  console.log('uploading text asset to ipfs')
  const encoder = new TextEncoder()

  const ipfsAssetUri = await uploadToPinata({
    data: {
      name: 'sandbox sample enc text asset',
      body: encoder.encode(JSON.stringify(encryptedAsset))
    },
    config: {
      pinataKey: process.env.PINATA_KEY || '',
      pinataSecret: process.env.PINATA_SECRET || ''
    },
    type: 'asset'
  })
  console.log('uploaded text asset to ipfs')

  asset = addIPFSData(asset, ipfsAssetUri?.IpfsHash || '')

  console.log('signing text asset')
  const signature = await signAssetNode(asset.data)
  asset = addSignatureData(asset, signature)

  console.log('text asset signed')

  console.log('uploading text asset meta to ipfs')
  const ipfsUri = await uploadToPinata({
    data: {
      name: 'sandbox sample string',
      body: asset
    },
    config: {
      pinataKey: process.env.PINATA_KEY || '',
      pinataSecret: process.env.PINATA_SECRET || ''
    },
    type: 'meta'
  })
  console.log('uploaded text asset meta to ipfs')

  let resp

  if (ipfsUri) {
    const ZeroHash =
      '0x0000000000000000000000000000000000000000000000000000000000000000'

    console.log('publishing to blockchain')
    resp = await publish(ZeroHash, {
      id: hash,
      uri: ipfsUri.IpfsHash || '',
      referenceOf: ZeroHash
    })
    console.log('published to blockchain')
    console.log(`transaction hash: ${resp.transactionHash}`)
  }

  return resp?.transactionHash || ''
}

async function publishImage(): Promise<string> {
  console.log('publishing encrypted image')
  const rawImageData = await getImageData('https://picsum.photos/300/300')
  const hash = await hashImage('https://picsum.photos/300/300')
  console.log('assetId ===> ', hash)

  let asset = buildAssetPayload(hash)
  asset.data.description = 'sandbox sample image'
  asset.data.type = 'image/jpeg'
  asset.data.encrypted = false
  asset.data.manifest.uri = 'https://verifymedia.com'
  asset.data.manifest.title = 'sandbox sample title'
  asset.data.manifest.creditedSource = 'verifymedia'
  asset.data.manifest.signingOrg.name = 'FOX'
  asset.data.manifest.signingOrg.unit = 'FOX'
  asset.data.manifest.published = new Date().toISOString()

  console.log('encrypting image asset using lit-protocol')
  const encryptedAsset = await encryptAsset({
    content: new Blob([rawImageData], { type: 'application/octet-stream' }),
    contentHash: hash
  })
  console.log('encrypted image asset using lit-protocol')

  asset = addEncryptionData(asset)

  console.log('uploading image asset to ipfs')
  const encoder = new TextEncoder()

  const ipfsAssetUri = await uploadToPinata({
    data: {
      name: 'sandbox sample enc image asset',
      body: encoder.encode(JSON.stringify(encryptedAsset))
    },
    config: {
      pinataKey: process.env.PINATA_KEY || '',
      pinataSecret: process.env.PINATA_SECRET || ''
    },
    type: 'asset'
  })
  console.log('uploaded image asset to ipfs')

  asset = addIPFSData(asset, ipfsAssetUri?.IpfsHash || '')

  let resp

  const ZeroHash =
    '0x0000000000000000000000000000000000000000000000000000000000000000'

  console.log('signing image asset')
  const signature = await signAssetNode(asset.data)
  asset = addSignatureData(asset, signature)
  console.log('signed image asset')

  console.log('uploading image asset meta to pinata')
  const ipfsImageMetaUri = await uploadToPinata({
    data: {
      name: 'sandbox sample asset',
      body: asset
    },
    config: {
      pinataKey: process.env.PINATA_KEY || '',
      pinataSecret: process.env.PINATA_SECRET || ''
    },
    type: 'meta'
  })
  console.log('uploaded image asset meta to pinata')

  if (ipfsImageMetaUri) {
    console.log('publishing to blockchain')
    resp = await publish(ZeroHash, {
      id: hash,
      uri: ipfsImageMetaUri.IpfsHash,
      referenceOf: ZeroHash
    })
    console.log('published to blockchain')
    console.log(`transaction hash: ${resp.transactionHash}`)
  }

  return resp?.transactionHash || ''
}

await publishText()
await publishImage()
