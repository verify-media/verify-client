import { init, getAssetDetails } from '@verify-media/verify-client'
import dotenv from 'dotenv'

dotenv.config()

init()
const input = process.argv[2]

if (!input) {
  console.error('Please provide an asset id')
  process.exit(1)
}

const pinataConfig = {
  pinataKey: process.env.PINATA_KEY || '',
  pinataSecret: process.env.PINATA_SECRET || ''
}

console.log('Fetching asset details...')
const assetDetails = await getAssetDetails(input, '', pinataConfig)
console.log(assetDetails)
