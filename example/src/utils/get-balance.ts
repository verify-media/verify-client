import ethers from 'ethers'
import dotenv from 'dotenv'

dotenv.config()

async function getBalance(): Promise<void> {
  const wallet = new ethers.Wallet(
    process.env.PVT_KEY || '',
    new ethers.providers.JsonRpcProvider(process.env.RPC_URL || '')
  )
  const balance = await wallet.getBalance()
  console.log(
    `${wallet.address} has Balance: ${ethers.utils.formatEther(balance)}`
  )
}

getBalance()
