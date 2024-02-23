import { ethers } from 'ethers'
import { getConfig } from './config'
/**
 * @hidden
 * @returns
 */
export async function getCurrentBlockTime(): Promise<Date> {
  const { rpcUrl } = getConfig()
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const block = await provider.getBlock('latest')
  const date = new Date(block.timestamp * 1000)

  return date
}
