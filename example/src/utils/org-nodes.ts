import { init, registerOrg } from '@verifymedia/client'
import dotenv from 'dotenv'
import { Wallet, ethers } from 'ethers'

dotenv.config()

init()

const wallet = new Wallet(
  process.env.ROOT_PVT_KEY || '',
  new ethers.providers.JsonRpcProvider(process.env.RPC_URL || '')
)

const resp = await registerOrg(wallet.address)
console.log(JSON.stringify(resp, null, 2))
