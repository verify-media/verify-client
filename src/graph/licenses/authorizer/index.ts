import { Contract, ethers } from 'ethers'
import { getConfig } from '../../../utils/config'
import { AUTHORIZER_ABI, ExpressionNode } from './types'
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
  const authorizerLicenseContract = new Contract(
    getLicense(LicenseType.authorizer, stage),
    AUTHORIZER_ABI,
    wallet
  )

  return { contract: authorizerLicenseContract, walletAddr: wallet.address }
}

/**
 * @param assetId: string id representing the asset
 * @param evalExpression: string expressing a boolean expression, using !,&,| and an int for auth contract indexes (using their true index i.e 0-2 is ok)
 * @param authContracts: string[] array of contract addresses that are part of the evaluation
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 */
export const setAuth = withErrorHandlingGraph(
  async (
    assetId: string,
    evalExpression: string,
    authContracts: string[]
  ): Promise<ethers.providers.TransactionReceipt> => {
    if (!assetId || !evalExpression || authContracts.length === 0) {
      throw new Error('assetId, evalExpression and authContracts  are required')
    }

    const gas = await checkGasLimits()
    const { contract } = await getContractInstance()
    debugLogger().debug(
      `setting state for id ${assetId} with expression ${evalExpression} and respective contracts ${authContracts}`
    )
    const txn: ethers.providers.TransactionResponse = await contract.setAuth(
      assetId,
      evalExpression,
      authContracts,
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
 * Returns the node with the given ID
 * @param {string} id - The ID of the node.
 * @returns {Promise<@link ExpressionNode>} A promise that resolves with the node.
 */
export const getNode = withErrorHandlingGraph(
  async (tokenId: string): Promise<ExpressionNode> => {
    if (!tokenId) {
      throw new Error('tokenId is required')
    }

    const { contract } = await getContractInstance()
    const node = await contract.getNode(tokenId)

    return node
  }
)

/**
 * Returns the root node of the expression tree
 * @param {string} assetId - The ID of the asset.
 * @returns {Promise<@link ExpressionNode>} A promise that resolves with the root node.
 */
export const getRoot = withErrorHandlingGraph(
  async (assetId: string): Promise<ExpressionNode> => {
    if (!assetId) {
      throw new Error('assetId is required')
    }

    const { contract } = await getContractInstance()
    const rootTuple = await contract.getRoot(assetId)

    return rootTuple
  }
)
