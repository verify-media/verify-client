import {
  registerRoot,
  init,
  version,
  register,
  createOrgNode
} from '@verify-media/verify-client'
import dotenv from 'dotenv'
import { Wallet, ethers } from 'ethers'

dotenv.config()

init()

let orgName = ''
const pretag = `verifymedia-client@${version} ===>`
if (process.env.ORG_NAME) {
  orgName = process.env.ORG_NAME
} else {
  console.log(`${pretag} no org name provided, using random name`)
  orgName = `test-org-${new Date().toISOString}`
}
console.log(`${pretag} registering root identity... ${orgName}`)
await registerRoot(orgName)
console.log(`${pretag} done`)

console.log(`${pretag} link intermediate wallet with root wallet`)
await register()
console.log(`${pretag} done`)

const wallet = new Wallet(
  process.env.ROOT_PVT_KEY || '',
  new ethers.providers.JsonRpcProvider(process.env.RPC_URL || '')
)

console.log(`${pretag} init org`)
await createOrgNode(wallet.address)
console.log(`${pretag} done`)
