import {
  init,
  version,
  setEmbargo,
  EmbargoTime,
  EmbargoPricingFunction,
  setPurchaseAccess
} from '@verify-media/verify-client'
import dotenv from 'dotenv'
import { BigNumber, ethers } from 'ethers'

dotenv.config()

init()
const pretag = `verifymedia-client@${version} ===>`

const assetId = process.argv[2]
if (!assetId) {
  console.error(`${pretag} asset id is required`)
  process.exit(1)
}

console.log(`${pretag} setting timebased license for ${assetId}`)

await setPurchaseAccess(assetId, 0.01)
await setEmbargo(assetId, {
  embargoDate: BigNumber.from(
    Math.floor(new Date().setDate(new Date().getDate() + 1) / 1000)
  ), // Convert to BigNumber
  retailPrice: ethers.utils.parseEther('0.01'),
  premium: ethers.utils.parseEther('0.001'),
  timeDenom: EmbargoTime.DAYS,
  priceFunc: EmbargoPricingFunction.LINEAR
})
console.log(`${pretag} done`)
