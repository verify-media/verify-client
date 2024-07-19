import { Contract, ethers } from 'ethers'
import { getConfig } from '../../../utils/config'
import { Embargo, TIMEBASED_LICENSE_ABI } from './types'
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
  const timeBasedLicenseContract = new Contract(
    getLicense(LicenseType.timebased, stage),
    TIMEBASED_LICENSE_ABI,
    wallet
  )

  return { contract: timeBasedLicenseContract, walletAddr: wallet.address }
}

/**
 * @param assetId: string id representing the asset
 * @param amount: number amount of matic to send
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 */
export const setPurchaseAccess = withErrorHandlingGraph(
  async (
    assetId: string,
    amount: number
  ): Promise<ethers.providers.TransactionReceipt> => {
    if (!assetId || !amount) {
      throw new Error('assetId and amount is required')
    }

    const gas = await checkGasLimits()
    const { contract } = await getContractInstance()
    debugLogger().debug(`trying to purchase access for  id ${assetId}`)
    const txn: ethers.providers.TransactionResponse =
      await contract.purchaseAccess(assetId, {
        gasPrice: gas,
        value: ethers.utils.parseEther(amount.toString())
      })

    const receipt: ethers.providers.TransactionReceipt = await txn.wait()

    return receipt
  }
)

/**
 * @param assetId: string id representing the asset
 * @param embargo: {<@link Embargo>} object containing the embargo details
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 */
export const setEmbargo = withErrorHandlingGraph(
  async (
    assetId: string,
    embargo: Embargo
  ): Promise<ethers.providers.TransactionReceipt> => {
    if (!assetId) {
      throw new Error('assetId is required')
    }

    if (
      !Object.values(embargo).every(
        (value) => value !== null && value !== undefined
      )
    ) {
      throw new Error('please provide all embargo values')
    }

    const gas = await checkGasLimits()
    const { contract } = await getContractInstance()
    debugLogger().debug(
      `setting auth for id ${assetId} with embargo ${JSON.stringify(embargo)}`
    )
    const txn: ethers.providers.TransactionResponse = await contract.setEmbargo(
      assetId,
      embargo,
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

/**
 * @param assetId: string id representing the asset
 * @returns {Promise<@link Embargo>} A promise that resolves with the embargo rules.
 */
export const getEmbargo = withErrorHandlingGraph(
  async (assetId: string): Promise<ethers.providers.TransactionReceipt> => {
    if (!assetId) {
      throw new Error('assetId is required')
    }

    const { contract } = await getContractInstance()
    const embargo = await contract.getEmbargo(assetId)

    return embargo
  }
)

/**
 * @param assetId: string id representing the asset
 * @param time: time unit in milliseconds
 * @returns {Promise<@link accessPrice>} A promise that resolves with the accessPrice.
 */
export const getAssetPrice = withErrorHandlingGraph(
  async (assetId: string, time: number): Promise<number> => {
    if (!assetId || !time) {
      throw new Error('assetId and time is required')
    }

    const { contract } = await getContractInstance()
    const accessPrice = await contract.price(assetId, time)

    return accessPrice
  }
)
