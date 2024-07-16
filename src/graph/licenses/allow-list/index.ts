import { Contract, ethers } from 'ethers'
import { getConfig } from '../../../utils/config'
import { ALLOW_LIST_ABI } from './types'
import { debugLogger } from '../../../utils/logger'
import { getLicense } from '../../../constants'
import { LicenseType } from '../../../types/app'
import { checkGasLimits, getWalletInstance } from '../../protocol'
import { withErrorHandlingGraph } from '../../../utils/error/decode-ether-error'

/**
 * @hidden
 * @returns
 */
export const getContractInstance = async (): Promise<{
  contract: Contract
  walletAddr: string
}> => {
  const { stage } = getConfig()
  const wallet = getWalletInstance()
  const allowListContract = new Contract(
    getLicense(LicenseType.allowlist, stage),
    ALLOW_LIST_ABI,
    wallet
  )

  return { contract: allowListContract, walletAddr: wallet.address }
}

/**
 * @param assetId: string id representing the asset
 * @param address: string address of the user which needs to be allowlisted for this asset
 * @param isAllowed: boolean whether the user is allowed to access the asset
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 */
export const setAuth = withErrorHandlingGraph(
  async (
    assetId: string,
    address: string,
    isAllowed: boolean
  ): Promise<ethers.providers.TransactionReceipt> => {
    if (!assetId || !address) {
      throw new Error('assetId and address are required')
    }
    if (typeof isAllowed !== 'boolean') {
      throw new Error('isAllowed must be a boolean')
    }
    const gas = await checkGasLimits()
    const { contract } = await getContractInstance()
    debugLogger().debug(
      `setting state for id ${assetId} and address ${address} with state ${isAllowed} on allowlist contract ${contract.address}`
    )
    const txn: ethers.providers.TransactionResponse = await contract.setState(
      assetId,
      address,
      isAllowed,
      {
        gasPrice: gas
      }
    )

    const receipt: ethers.providers.TransactionReceipt = await txn.wait()

    return receipt
  }
)

/**
 * @param assetId: string id representing the asset
 * @param address: string address of the user whose access needs to be checked for this asset
 * @returns {Promise<isAuthorized>}: boolean whether the user is allowed to access the asset
 */
export const checkAuth = withErrorHandlingGraph(
  async (assetId: string, address: string): Promise<boolean> => {
    if (!assetId || !address) {
      throw new Error('assetId and address are required')
    }

    const { contract } = await getContractInstance()
    const isAuthorized = await contract.auth(assetId, address)

    return isAuthorized
  }
)
