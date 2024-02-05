import {
  registerRoot,
  init,
  register,
  hashData,
  encryptAsset,
  publish,
  uploadToPinata,
  signAssetNode,
  buildAssetPayload,
  addEncryptionData,
  addIPFSData,
  addSignatureData,
  verifyAsset
} from '@verify-media/verify-client'
import dotenv from 'dotenv'
dotenv.config()

const wait = (ms: number): Promise<number> =>
  new Promise((resolve) => setTimeout(resolve, ms))

init()

// needs to happen only once
console.log('registering root wallet...')
await registerRoot('my-org')
console.log('waiting for root registration to complete...')
await wait(3000) // random wait time for transaction to commit on chain
console.log('root registration complete')

// needs to happen only once
console.log('registering intermediate wallet...')
await register()
console.log('waiting for registration to complete...')
await wait(3000) // random wait time for transaction to commit on chain
console.log('registration complete')

console.log('publishing asset...')
const text = 'hello world'
const hash = hashData(text) //asset hash acts as the asset id

let asset = buildAssetPayload(hash)
asset.data.description = 'sandbox sample string'
// asset.data.type = 'text/html'
asset.data.encrypted = true
asset.data.manifest.uri = 'https://verifymedia.com'
asset.data.manifest.title = 'sandbox sample title'
asset.data.manifest.creditedSource = 'verifymedia'
asset.data.manifest.signingOrg.name = 'MY_ORG'
asset.data.manifest.signingOrg.unit = 'MY_ORG'
asset.data.manifest.published = new Date().toISOString()

console.log('encrypting asset...')
const blob = new Blob([text], { type: 'text/plain' })
const encryptedAsset = await encryptAsset({
  content: blob,
  contentHash: hash
})
asset = addEncryptionData(asset, encryptedAsset)

console.log('uploading asset to ipfs...')
// upload the encrypted asset to ipfs
const ipfsAssetUri = await uploadToPinata({
  data: {
    name: 'sandbox sample enc text asset',
    body: new TextEncoder().encode(encryptedAsset.dataToEncryptHash) // since text needs to be converted to a blob
  },
  config: {
    pinataKey: process.env.PINATA_KEY || '',
    pinataSecret: process.env.PINATA_SECRET || ''
  },
  type: 'asset'
})

asset = addIPFSData(asset, ipfsAssetUri?.IpfsHash || '')

console.log('signing asset...')
const signature = await signAssetNode(asset.data)
asset = addSignatureData(asset, signature)

// upload the asset meta data to ipfs
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

const ZeroHash =
  '0x0000000000000000000000000000000000000000000000000000000000000000'

console.log('publishing to blockchain...')
const resp = await publish(ZeroHash, {
  id: hash,
  uri: ipfsUri?.IpfsHash || '',
  referenceOf: ZeroHash
})
console.log('waiting for publish to complete...')
await wait(3000) // random wait time for transaction to commit on chain
console.log(`publish complete with transaction hash: ${resp.transactionHash}`)

console.log('verifying asset...')
const verifiedAsset = await verifyAsset(hash, asset)
console.log(verifiedAsset)
