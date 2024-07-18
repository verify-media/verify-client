import { init, version, setAllowList } from '@verify-media/verify-client'
import dotenv from 'dotenv'

dotenv.config()

init()
const pretag = `verifymedia-client@${version} ===>`

const assetId = process.argv[2]
if (!assetId) {
  console.error(`${pretag} asset id is required`)
  process.exit(1)
}

const addr = process.argv[3]
if (!addr) {
  console.error(`${pretag} address is required`)
  process.exit(1)
}

console.log(`${pretag} setting allow list... for ${addr}`)
await setAllowList(assetId, addr, true)
console.log(`${pretag} done`)
