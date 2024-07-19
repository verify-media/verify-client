/* eslint-disable no-case-declarations */
import {
  init,
  version,
  getEmbargo,
  getAssetPrice
} from '@verify-media/verify-client'
import dotenv from 'dotenv'

dotenv.config()

init()
const pretag = `verifymedia-client@${version} ===>`

const assetId = process.argv[2]
const licenseType = process.argv[3]
if (!assetId) {
  console.error(`${pretag} asset id is required`)
  process.exit(1)
}
if (!licenseType) {
  console.error(`${pretag} license type is required`)
  process.exit(1)
}

console.log(`${pretag} reading ${licenseType} license for ${assetId}`)

switch (licenseType.toLowerCase()) {
  case 'timebased':
    const embargo = await getEmbargo(assetId)
    const assetPrice = await getAssetPrice(
      assetId,
      Math.floor(new Date().getTime() / 1000)
    )
    console.log(`${pretag} embargo: ${JSON.stringify(embargo)}`)
    console.log(`${pretag} asset price: ${assetPrice}`)
    break
  default:
    console.error(
      `${pretag} invalid license type or not supported in this script yet`
    )
    process.exit(1)
}

console.log(`${pretag} done`)
