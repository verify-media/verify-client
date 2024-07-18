import {
  init,
  version,
  setAuthorizer,
  LICENSE_TYPES,
  getLicense
} from '@verify-media/verify-client'
import dotenv from 'dotenv'

dotenv.config()

init()
const pretag = `verifymedia-client@${version} ===>`

const assetId = process.argv[2]
if (!assetId) {
  console.error(`${pretag} asset id is required`)
  process.exit(1)
}

console.log(`${pretag} setting authorizer for ${assetId}`)

await setAuthorizer(assetId, '0&1', [
  getLicense(LICENSE_TYPES.public, 'sandbox'),
  getLicense(LICENSE_TYPES.allowlist, 'sandbox')
])
console.log(`${pretag} done`)
