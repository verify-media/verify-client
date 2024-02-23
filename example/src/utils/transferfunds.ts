import { Wallet, ethers } from 'ethers'
import dotenv from 'dotenv'

dotenv.config()

const withdrawFunds = async (
  recipientAddress: string,
  amount: string
): Promise<string> => {
  if (!recipientAddress) throw new Error('Recipient address is required')

  const wallet = new Wallet(
    process.env.PVT_KEY || '',
    new ethers.providers.JsonRpcProvider(process.env.RPC_URL || '')
  )

  const amountToSend = ethers.utils.parseEther(amount)

  const transaction = {
    to: recipientAddress,
    value: amountToSend
  }

  const tx = await wallet.sendTransaction(transaction)

  return tx.hash
}

const input = process.argv[2]
const input2 = process.argv[3]

if (!input || !input2) {
  console.error('Please provide an recipient address and amount to send')
  process.exit(1)
}

await withdrawFunds(input, input2)
