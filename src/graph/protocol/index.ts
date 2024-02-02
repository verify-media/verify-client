// Copyright 2023 Blockchain Creative Labs LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { Wallet, Contract, ethers, BigNumber, utils } from 'ethers'

import { getConfig } from '../../utils/config'
import {
  GRAPH_V2_ABI,
  ContentGraphNode,
  ContentNode,
  ContentNodes,
  PublishParam,
  NodeType,
  PublishParams,
  Node
} from './types'

import { ensureIPFS, hashData } from '../../utils/app'
import { AssetNode } from '../../types/schema'
import { whoIs } from '../identity'
import { getGraphContractAddress } from '../../constants'

/**
 * @hidden
 * @returns
 */
export const getWalletInstance = (): Wallet => {
  const { pvtKey, rpcUrl } = getConfig()
  const wallet = new Wallet(
    pvtKey || '',
    new ethers.providers.JsonRpcProvider(rpcUrl)
  )

  return wallet
}

/**
 * @hidden
 * @returns
 */
export const getContractInstance = (): Contract => {
  const wallet = getWalletInstance()
  const graphContract = new Contract(
    getGraphContractAddress(getConfig().stage),
    GRAPH_V2_ABI,
    wallet
  )

  return graphContract
}

/**
 * @hidden
 * @returns
 */
export const getLegacyGas = async (): Promise<BigNumber> => {
  const wallet = getWalletInstance()
  let gas = await wallet.provider.getGasPrice()
  if (!gas) {
    console.warn('gas price not set, using default')
    gas = ethers.utils.parseUnits('2000', 'gwei')
  }

  return gas
}

/**
 * @hidden
 * @returns
 */
export async function checkGasgLimits(): Promise<BigNumber> {
  const { maxGasPrice } = getConfig()
  /* istanbul ignore next */
  if (!maxGasPrice) {
    console.warn('max gas price not set, using network gas')
    const gas = await getLegacyGas()

    return gas
  }

  const maxGas = BigNumber.from(maxGasPrice)
  const gas = await getLegacyGas()
  if (gas.gt(maxGas)) {
    throw new Error('Gas limit exceeded as mentioned in config')
  }

  return gas
}

/**
 * Returns the number of nodes created by the registered wallet making this call. [ref](https://docs.verifymedia.com/publishing/graph/contract/#nodescreatedaddress-user)
 *
 * @returns {Promise<BigNumber>} A promise that resolves with the number of nodes created by the registered wallet making this call.
 */
export const getNodesCreated = async (): Promise<number> => {
  const graphContract = getContractInstance()
  const wallet = getWalletInstance()

  return await graphContract.nodesCreated(wallet.address)
}

/**
 * Returns the node with the given ID of type {@link NodeType}. [ref](https://docs.verifymedia.com/publishing/graph/contract/#getnodebytes32-id)
 *
 * @param {string} id - The ID of the node.
 * @returns {Promise<@link ContentGraphNode>} A promise that resolves with the node.
 */
export const getNode = async (id: string): Promise<ContentGraphNode> => {
  const graphContract = getContractInstance()

  const node = await graphContract.getNode(id)

  return {
    token: node?.token,
    nodeType: node?.nodeType,
    id: node?.id,
    uri: node?.uri,
    referenceOf: node?.referenceOf,
    accessAuth: node?.accessAuth,
    referenceAuth: node?.referenceAuth
  }
}

/**
 * Sets the URI (ipfs, s3, arweave etc.) of the node with the given ID. [ref](https://docs.verifymedia.com/publishing/graph/contract/#seturibytes32-id-string-calldata-uri)
 *
 * @param {string} id - The ID of the node.
 * @param {string} uri - The new URI of the node.
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 */
export const setUri = async (
  id: string,
  uri: string
): Promise<ethers.providers.TransactionReceipt> => {
  const gas = await checkGasgLimits()
  const graphContract = getContractInstance()

  const txn: ethers.providers.TransactionResponse = await graphContract.setURI(
    id,
    ensureIPFS(uri),
    {
      gasPrice: gas
    }
  )

  const receipt: ethers.providers.TransactionReceipt = await txn.wait()

  return receipt
}

/**
 * Verifies the given asset.
 *
 * @param {string} assetId - The ID of the asset.
 * @param {AssetNode} asset - The asset to verify.
 * @returns {Promise<{
 *   signatureVerified: boolean
 *   contentBindingVerified: boolean
 *   signer: string
 *   root: string
 * }>} A promise that resolves with an object containing the verification results.
 */
export const verifyAsset = async (
  assetId: string,
  asset: AssetNode
): Promise<{
  signatureVerified: boolean
  contentBindingVerified: boolean
  signer: string
  root: string
}> => {
  const validity = {
    signatureVerified: false,
    contentBindingVerified: false,
    signer: '',
    root: ''
  }
  const metadataString = JSON.stringify(asset.data)
  const calculatedMessage = hashData(metadataString)
  if (calculatedMessage === asset.signature.message) {
    validity.signatureVerified = true
  }

  if (assetId === asset.data.contentBinding.hash) {
    validity.contentBindingVerified = true
  }

  const address = utils.verifyMessage(
    calculatedMessage,
    asset.signature.signature
  )
  validity.signer = address
  const rootAddress = await whoIs(address)
  validity.root = rootAddress

  return validity
}

/**
 * Publishes an asset node under the given parent node. [ref](https://docs.verifymedia.com/publishing/graph/contract/#publishbytes32-parentid-contentnode-content)
 *
 * @param {string} parentNodeId - The ID of the parent node.
 * @param {PublishParam} publishParams - The parameters for the new asset.
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 */
export const publish = async (
  parentNodeId: string,
  publishParams: PublishParam
): Promise<ethers.providers.TransactionReceipt> => {
  const graphContract = getContractInstance()
  const gas = await checkGasgLimits()
  const contentNode: ContentNode = {
    ...publishParams,
    nodeType: NodeType.ASSET
  }

  const txn: ethers.providers.TransactionResponse = await graphContract.publish(
    parentNodeId,
    contentNode,
    {
      gasPrice: gas
    }
  )

  const receipt: ethers.providers.TransactionReceipt = await txn.wait()

  return receipt
}

/**
 * Publishes an array of asset nodes under the given parent node. [ref](https://docs.verifymedia.com/publishing/graph/contract/#publishbulkbytes32-parentid-contentnode-calldata-content)
 *
 * @param {string} parentNodeId - The ID of the parent node.
 * @param {PublishParams} publishParams - The parameters for the new asset.
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 */
export const publishBulk = async (
  parentNodeId: string,
  publishParams: PublishParams
): Promise<ethers.providers.TransactionReceipt> => {
  const graphContract = getContractInstance()
  const gas = await checkGasgLimits()
  const contentNodes: ContentNodes = publishParams.map((publishParam) => {
    return { ...publishParam, nodeType: NodeType.ASSET }
  })

  const txn: ethers.providers.TransactionResponse =
    await graphContract.publishBulk(parentNodeId, contentNodes, {
      gasPrice: gas
    })

  const receipt: ethers.providers.TransactionReceipt = await txn.wait()

  return receipt
}

/**
 * returns total number of nodes created in the content graph. [ref](https://docs.verifymedia.com/publishing/graph/contract/#totalsupply)
 * @returns {Promise<number>}
 */
export const getTotalSuppy = async (): Promise<number> => {
  const graphContract = getContractInstance()

  return await graphContract.totalSupply()
}

/**
 * creates a node of type {@link NodeType} if all protocol [conditions](https://docs.verifymedia.com/publishing/graph/contract/#createnodebytes32-id-bytes32-parentid-nodetype-nodetype-bytes32-referenceof) are met
 * @param node {@link Node}
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 */
export const createNode = async (
  node: Node
): Promise<ethers.providers.TransactionReceipt> => {
  const graphContract = getContractInstance()
  const gas = await checkGasgLimits()

  const txn: ethers.providers.TransactionResponse =
    await graphContract.createNode(
      node.id,
      node.parentId,
      node.nodeType,
      node.referenceOf,
      {
        gasPrice: gas
      }
    )

  const receipt: ethers.providers.TransactionReceipt = await txn.wait()

  return receipt
}

/**
 * Moves a node corresponding to the passed id to org node corresponding to the passed newParentId. [ref](https://docs.verifymedia.com/publishing/graph/contract/#movebytes32-id-bytes32-newparentid)
 * @param assetId
 * @param parentId
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 */
export const changeParent = async (
  assetId: string,
  parentId: string
): Promise<ethers.providers.TransactionReceipt> => {
  const graphContract = getContractInstance()
  const gas = await checkGasgLimits()

  const txn: ethers.providers.TransactionResponse = await graphContract.move(
    assetId,
    parentId,
    {
      gasPrice: gas
    }
  )

  const receipt: ethers.providers.TransactionReceipt = await txn.wait()

  return receipt
}

/**
 * Sets the access authorization contract for the node at id. [ref](https://docs.verifymedia.com/publishing/graph/contract/#setaccessauthbytes32-id-address-accessauth)
 * @param assetId
 * @param accessAuthAddress
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 */
export const setAccessAuth = async (
  assetId: string,
  accessAuthAddress: string
): Promise<ethers.providers.TransactionReceipt> => {
  const graphContract = getContractInstance()
  const gas = await checkGasgLimits()

  const txn: ethers.providers.TransactionResponse =
    await graphContract.setAccessAuth(assetId, accessAuthAddress, {
      gasPrice: gas
    })

  const receipt: ethers.providers.TransactionReceipt = await txn.wait()

  return receipt
}

/**
 * Sets the reference authorization contract for the node at id. [ref](https://docs.verifymedia.com/publishing/graph/contract/#setreferenceauthbytes32-id-address-referenceauth)
 * @param assetId
 * @param accessAuthAddress
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 */
export const setReferenceAuth = async (
  assetId: string,
  refAccessAuthAddress: string
): Promise<ethers.providers.TransactionReceipt> => {
  const graphContract = getContractInstance()
  const gas = await checkGasgLimits()

  const txn: ethers.providers.TransactionResponse =
    await graphContract.setReferenceAuth(assetId, refAccessAuthAddress, {
      gasPrice: gas
    })

  const receipt: ethers.providers.TransactionReceipt = await txn.wait()

  return receipt
}

/**
 * returns a boolean if the user is authorised to access the content. [ref](https://docs.verifymedia.com/publishing/graph/contract/#authbytes32-id-address-user)
 * @param assetId
 * @param userAddress
 * @returns {Promise<boolean>}
 */
export const checkAuth = async (
  assetId: string,
  userAddress: string
): Promise<boolean> => {
  const graphContract = getContractInstance()
  const gas = await checkGasgLimits()

  const isAuthorised = await graphContract.auth(assetId, userAddress, {
    gasPrice: gas
  })

  return isAuthorised
}

/**
 * returns a boolean if the user is authorised to reference the content. [ref](https://docs.verifymedia.com/publishing/graph/contract/#refauthid-user)
 * @param assetId
 * @param userAddress
 * @returns {Promise<boolean>}
 */
export const checkRefAuth = async (
  assetId: string,
  userAddress: string
): Promise<ethers.providers.TransactionReceipt> => {
  const graphContract = getContractInstance()
  const gas = await checkGasgLimits()

  const isAuthorised = await graphContract.refAuth(assetId, userAddress, {
    gasPrice: gas
  })

  return isAuthorised
}

/**
 * returns the node corresponding to the passed token id. [ref](https://docs.verifymedia.com/publishing/graph/contract/#tokentonodeuint256-token)
 * @param tokenId
 * @returns {Promise<@link ContentGraphNode>}
 */
export const getTokenToNode = async (
  tokenId: number
): Promise<ContentGraphNode> => {
  const graphContract = getContractInstance()
  const gas = await checkGasgLimits()

  const node: ContentGraphNode = await graphContract.tokenToNode(tokenId, {
    gasPrice: gas
  })

  return node
}
