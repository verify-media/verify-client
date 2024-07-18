import {
  init,
  version,
  setAccessAuth,
  LICENSE_TYPES
} from '@verify-media/verify-client'
import dotenv from 'dotenv'

dotenv.config()

init()

const pretag = `verifymedia-client@${version} ===>`
const assetId = process.argv[2] || ''
if (!assetId) {
  throw new Error(`${pretag} assetId is required`)
}

const tx = await setAccessAuth(assetId, LICENSE_TYPES.allowlist)
console.log(`${pretag} published with ${tx.transactionHash}`)
