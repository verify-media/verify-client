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
  Node,
  AssetDetails,
  RefContentNode,
  OrgStruct
} from './types'

import { ensureIPFS, hashData, trimLowerCase } from '../../utils/app'
import { AssetNode } from '../../types/schema'
import { whoIs } from '../identity'
import {
  PROTOCOL_ERRORS,
  getGraphContractAddress,
  getLicense
} from '../../constants'
import { fetchFromIPFS } from '../../storage/ipfs'
import { fetchFileFromPinata } from '../../read'
import { PinataConfig } from '../../storage/pinata/types'
import {
  VerifyError,
  withErrorHandlingGraph
} from '../../utils/error/decode-ether-error'
import { debugLogger } from '../../utils/logger'
import { LicenseType } from '../../types/app'

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
  let gas: BigNumber = await wallet.provider.getGasPrice()

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
export async function checkGasLimits(): Promise<BigNumber> {
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
 * Returns the number of nodes created by the registered wallet making this call.
 * @param {string} rootWalletAddress - The address of the root wallet.
 * @returns {Promise<BigNumber>} A promise that resolves with the number of nodes created by the registered wallet making this call.
 */
export const getNodesCreated = async (
  rootWalletAddress: string
): Promise<BigNumber> => {
  const graphContract = getContractInstance()

  return await graphContract.nodesCreated(rootWalletAddress)
}

/**
 * Returns the node with the given ID of type {@link NodeType}.
 *
 * @param {string} id - The ID of the node.
 * @returns {Promise<@link ContentGraphNode>} A promise that resolves with the node.
 */
export const getNode = async (id: string): Promise<ContentGraphNode> => {
  const graphContract = getContractInstance()

  debugLogger().debug(`get node ${id}`)

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
 * Retrieves the parent node token ID of a given token ID.
 * @param tokenId - token ID whose parent node is to be retrieved.
 * @returns A promise that resolves to the parent node token ID.
 */
const parentOf = async (tokenId: string): Promise<string> => {
  const graphContract = getContractInstance()

  const parentNode = await graphContract.parentOf(tokenId)

  return parentNode.toString()
}

/**
 * Retrieves the children node token IDs of a given token ID.
 * @param tokenId - token ID of the node whose children node token IDs are to be retrieved.
 * @returns A promise that resolves to an array of children node token IDs.
 */
const childrenOf = async (tokenId: string): Promise<string[]> => {
  const graphContract = getContractInstance()

  const childrenIds = await graphContract.childrenOf(tokenId)

  return childrenIds
}

/**
 * Gets the node corresponding to the passed token id.
 * @param id - token ID.
 * @returns A promise that resolves to a object of type {@link ContentGraphNode}.
 */
const tokenToNode = async (id: string): Promise<ContentGraphNode> => {
  const graphContract = getContractInstance()

  const node = await graphContract.tokenToNode(id)

  return node
}

/**
 * Retrieves the parent node of a given node ID.
 * @param nodeId - The ID of the node whose parent node is to be retrieved.
 * @returns A promise that resolves to a object fo type {@link ContentGraphNode} representing the parent node.
 */
export const getParentNode = async (
  nodeId: string
): Promise<ContentGraphNode> => {
  const graphContract = getContractInstance()
  debugLogger().debug(`get parent node for ${nodeId}`)
  const node = await getNode(nodeId)
  debugLogger().debug(`get parent token for ${node.token.toString()}`)
  const parentToken = await graphContract.parentOf(node.token.toString())
  debugLogger().debug(`get token to node for ${parentToken}`)
  const parentNode = await tokenToNode(parentToken)

  return parentNode
}

/**
 * Retrieves the children nodes of a given node ID.
 * @param nodeId - The ID of the node whose children nodes are to be retrieved.
 * @returns A promise that resolves to an array objects of type {@link ContentGraphNodes} representing the children nodes.
 */
export const getChildrenNodes = async (
  nodeId: string
): Promise<ContentGraphNode[]> => {
  const graphContract = getContractInstance()
  debugLogger().debug(`get node for ${nodeId}`)
  const node = await getNode(nodeId)
  debugLogger().debug(`get children for ${node.token.toString()}`)
  const childrenIds = await graphContract.childrenOf(node.token.toString())
  debugLogger().debug(`get children nodes for  ${childrenIds}`)
  const promises = childrenIds.map(async (childId: string) => {
    const node = await tokenToNode(childId)

    return node
  })

  return await Promise.all(promises)
}

/**
 * Sets the URI (ipfs, s3, arweave etc.) of the node with the given ID.
 *
 * @param {string} id - The ID of the node.
 * @param {string} uri - The new URI of the node.
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 */
export const setUri = withErrorHandlingGraph(
  async (
    id: string,
    uri: string
  ): Promise<ethers.providers.TransactionReceipt> => {
    debugLogger().debug('check gas limits')

    const gas = await checkGasLimits()
    const graphContract = getContractInstance()

    debugLogger().debug(`setting uri ${uri} for ${id} on chain`)

    const txn: ethers.providers.TransactionResponse =
      await graphContract.setURI(id, ensureIPFS(uri), {
        gasPrice: gas
      })

    const receipt: ethers.providers.TransactionReceipt = await txn.wait()

    return receipt
  }
)

/**
 * Verifies the given asset, by validating the signature and content binding.
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
  debugLogger().debug(`verify asset ${assetId}`)
  const validity = {
    signatureVerified: false,
    contentBindingVerified: false,
    signer: '',
    root: ''
  }

  const metadataString = JSON.stringify(asset.data)

  debugLogger().debug(`hashing metadata`)

  const calculatedMessage = hashData(metadataString)

  debugLogger().debug(
    `compare asset signature message and calculated message ${calculatedMessage}`
  )
  if (calculatedMessage === asset.signature.message) {
    debugLogger().debug(`message verified`)
    validity.signatureVerified = true
  }

  debugLogger().debug(`compare assetId and contentBinding hash ${assetId}`)
  if (assetId === asset.data.contentBinding.hash) {
    debugLogger().debug(`contentBinding verified`)
    validity.contentBindingVerified = true
  }

  const address = utils.verifyMessage(
    calculatedMessage,
    asset.signature.signature
  )

  debugLogger().debug(`signer address ${address}`)

  validity.signer = address
  const rootAddress = await whoIs(address)

  debugLogger().debug(`root address ${rootAddress}`)
  validity.root = rootAddress

  return validity
}

/**
 * Publishes an asset node under the given parent node.
 *
 * @param {string} parentNodeId - The ID of the parent node.
 * @param {PublishParam} publishParams - The parameters for the new asset.
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 */
export const publish = withErrorHandlingGraph(
  async (
    parentNodeId: string,
    publishParams: PublishParam
  ): Promise<ethers.providers.TransactionReceipt> => {
    const graphContract = getContractInstance()

    debugLogger().debug('check gas limits')

    const gas = await checkGasLimits()

    const contentNode: ContentNode = {
      ...publishParams,
      nodeType: NodeType.ASSET
    }

    debugLogger().debug(
      `publishing content ${contentNode.id} under ${parentNodeId}`
    )

    const txn: ethers.providers.TransactionResponse =
      await graphContract.publish(parentNodeId, contentNode, {
        gasPrice: gas
      })

    const receipt: ethers.providers.TransactionReceipt = await txn.wait()

    return receipt
  }
)

/**
 * Publishes a reference node under the given parent node.
 * @param {string} parentNodeId - The ID of the parent node.
 * @param {PublishParams} publishParams - The parameters for the new assets.
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 **/
export const publishRef = withErrorHandlingGraph(
  async (
    parentNodeId: string,
    publishParams: PublishParam
  ): Promise<ethers.providers.TransactionReceipt> => {
    const graphContract = getContractInstance()
    const gas = await checkGasLimits()
    const contentNode: RefContentNode = {
      ...publishParams,
      nodeType: NodeType.REFERENCE
    }

    const txn: ethers.providers.TransactionResponse =
      await graphContract.publish(parentNodeId, contentNode, {
        gasPrice: gas
      })

    const receipt: ethers.providers.TransactionReceipt = await txn.wait()

    return receipt
  }
)

/**
 * Publishes an array of asset nodes under the given parent node.
 *
 * @param {string} parentNodeId - The ID of the parent node.
 * @param {PublishParams} publishParams - The parameters for the new asset.
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 *
 * @hidden
 */
export const publishBulk = withErrorHandlingGraph(
  async (
    parentNodeId: string,
    publishParams: PublishParams
  ): Promise<ethers.providers.TransactionReceipt> => {
    const graphContract = getContractInstance()
    const gas = await checkGasLimits()
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
)

/**
 * returns total number of nodes created in the content graph.
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
export const createNode = withErrorHandlingGraph(
  async (node: Node): Promise<ethers.providers.TransactionReceipt> => {
    const graphContract = getContractInstance()

    debugLogger().debug('check gas limits')

    const gas = await checkGasLimits()

    debugLogger().debug(`create node ${node.id} on chain`)

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
)

/**
 * Moves a node corresponding to the passed parentId to an org node corresponding to the passed newParentId.
 * @param assetId
 * @param parentId
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 */
export const changeParent = withErrorHandlingGraph(
  async (
    assetId: string,
    parentId: string
  ): Promise<ethers.providers.TransactionReceipt> => {
    const graphContract = getContractInstance()

    debugLogger().debug('check gas limits')

    const gas = await checkGasLimits()

    debugLogger().debug(`move parent for ${assetId} to new parent ${parentId}`)

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
)

/**
 * Sets the access authorization contract for the node at id. [ref](https://docs.verifymedia.com/publishing/graph/contract/#setaccessauthbytes32-id-address-accessauth)
 * @param assetId
 * @param licenseType
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 */
export const setAccessAuth = withErrorHandlingGraph(
  async (
    assetId: string,
    licenseType: LicenseType
  ): Promise<ethers.providers.TransactionReceipt> => {
    const { stage } = getConfig()
    const license = getLicense(licenseType, stage)
    if (!license) {
      throw new Error(
        `Invalid license type, only allowed types are ${Object.values(LicenseType)}`
      )
    }
    const graphContract = getContractInstance()
    const gas = await checkGasLimits()

    debugLogger().debug(`setting access auth for ${assetId} with ${license}`)

    const txn: ethers.providers.TransactionResponse =
      await graphContract.setAccessAuth(assetId, license, {
        gasPrice: gas
      })

    debugLogger().debug(`${license} applied to ${assetId}`)

    const receipt: ethers.providers.TransactionReceipt = await txn.wait()

    return receipt
  }
)

/**
 * Sets the reference authorization contract on the node with the given ID.
 * @param assetId
 * @param accessAuthAddress
 * @returns {Promise<ethers.providers.TransactionReceipt>} A promise that resolves with the transaction receipt.
 * For more information, see [Ethers.js Documentation](https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt).
 */
export const setReferenceAuth = withErrorHandlingGraph(
  async (
    assetId: string,
    licenseType: LicenseType
  ): Promise<ethers.providers.TransactionReceipt> => {
    const { stage } = getConfig()
    const license = getLicense(licenseType, stage)
    if (!license) {
      throw new Error(
        `Invalid license type, only allowed types are ${Object.values(LicenseType)}`
      )
    }

    const graphContract = getContractInstance()
    debugLogger().debug('check gas limits')
    const gas = await checkGasLimits()

    debugLogger().debug(`set reference auth ${license} for ${assetId} on chain`)

    const txn: ethers.providers.TransactionResponse =
      await graphContract.setReferenceAuth(assetId, license, {
        gasPrice: gas
      })

    const receipt: ethers.providers.TransactionReceipt = await txn.wait()

    return receipt
  }
)

/**
 * returns a boolean if the user is authorised to access the content.
 * @param assetId
 * @param userAddress
 * @returns {Promise<boolean>}
 */
export const checkAuth = async (
  assetId: string,
  userAddress: string
): Promise<boolean> => {
  const graphContract = getContractInstance()
  debugLogger().debug('check gas limits')
  const gas = await checkGasLimits()

  debugLogger().debug(`check auth for ${assetId} by ${userAddress}`)
  const isAuthorized = await graphContract.auth(assetId, userAddress, {
    gasPrice: gas
  })

  return isAuthorized
}

/**
 * returns a boolean if the user is authorised to reference the content.
 * @param assetId
 * @param userAddress
 * @returns {Promise<boolean>}
 */
export const checkRefAuth = async (
  assetId: string,
  userAddress: string
): Promise<ethers.providers.TransactionReceipt> => {
  const graphContract = getContractInstance()
  debugLogger().debug('check gas limits')
  const gas = await checkGasLimits()

  debugLogger().debug(`check ref auth for ${assetId} by ${userAddress}`)
  const isAuthorized = await graphContract.refAuth(assetId, userAddress, {
    gasPrice: gas
  })

  return isAuthorized
}

/**
 * returns the node corresponding to the passed token id.
 * @param tokenId
 * @returns {Promise<@link ContentGraphNode>}
 */
export const getTokenToNode = async (
  tokenId: number
): Promise<ContentGraphNode> => {
  const graphContract = getContractInstance()
  debugLogger().debug('check gas limits')
  const gas = await checkGasLimits()

  debugLogger().debug(`get node for token ${tokenId}`)
  const node: ContentGraphNode = await graphContract.tokenToNode(tokenId, {
    gasPrice: gas
  })

  return node
}

/**
 * Creates an orgNode and an originalMaterial node on the protocol for a publisher represented by the rootWalletAddress.
 * @param rootWalletAddress
 * @returns {Promise<OrgStruct>} a promise that resolves with the org and original material node id and respective transaction hash
 */
export const registerOrg = withErrorHandlingGraph(
  async (rootWalletAddress: string): Promise<OrgStruct> => {
    const ZeroHash =
      '0x0000000000000000000000000000000000000000000000000000000000000000'
    // create org node

    let incrBy = 1

    debugLogger().debug(`get nodes created for ${rootWalletAddress}`)

    let nodesCreated = (
      (await getNodesCreated(rootWalletAddress)).toNumber() + incrBy
    ).toString()

    debugLogger().debug(`nodesCreated ${nodesCreated}`)

    const orgId = ethers.utils.solidityKeccak256(
      ['address', 'uint256'],
      [rootWalletAddress, nodesCreated]
    )

    debugLogger().debug(`orgId ${orgId}`)

    let orgTransaction = null
    try {
      orgTransaction = await createNode({
        id: orgId,
        parentId: ZeroHash,
        nodeType: NodeType.ORG,
        referenceOf: ZeroHash
      })
    } catch (error) {
      if ((error as VerifyError).data === PROTOCOL_ERRORS.NODE_EXISTS) {
        incrBy = incrBy + 1
        debugLogger().debug('org node already exists')
      } else {
        throw error
      }
    }

    //create og node
    nodesCreated = (
      (await getNodesCreated(rootWalletAddress)).toNumber() + 1
    ).toString()

    debugLogger().debug(`nodesCreated ${nodesCreated}`)

    const ogId = ethers.utils.solidityKeccak256(
      ['address', 'uint256'],
      [rootWalletAddress, nodesCreated]
    )

    debugLogger().debug(`ogId ${ogId}`)

    let ogTransaction = null
    try {
      ogTransaction = await createNode({
        id: ogId,
        parentId: orgId,
        nodeType: NodeType.ORG,
        referenceOf: ZeroHash
      })
    } catch (error) {
      if ((error as VerifyError).data === PROTOCOL_ERRORS.NODE_EXISTS) {
        debugLogger().debug('og node already exists')
      } else {
        throw error
      }
    }

    return {
      org: {
        id: orgId,
        txnHash: orgTransaction?.transactionHash || ''
      },
      originalMaterial: {
        id: ogId,
        txnHash: ogTransaction?.transactionHash || ''
      }
    }
  }
)

/**
 * Creates a license node.
 * @param licensedFrom - The entity from which the license is obtained.
 * @param orgNode - The organization node.
 * @returns A promise that resolves to the node id of the created license node.
 * @throws Will throw an error if the node already exists.
 */
export const createLicenseNode = withErrorHandlingGraph(
  async (licensedFrom: string, orgNode: string): Promise<string> => {
    const ZeroHash =
      '0x0000000000000000000000000000000000000000000000000000000000000000'
    debugLogger().debug(`check if license node exists`)
    const nodeId = hashData(trimLowerCase(`${orgNode}-license-${licensedFrom}`))
    try {
      await getNode(nodeId)
    } catch (error) {
      debugLogger().debug(`license node does not exist`)
      // create license node under org node
      debugLogger().debug(`create license node ${nodeId}`)
      await createNode({
        id: nodeId,
        parentId: orgNode.toString(),
        nodeType: NodeType.ORG,
        referenceOf: ZeroHash
      })
    }

    return nodeId
  }
)

/**
 * This creates a node of type ASSET with an hierarchy of ORG->OG->ASSET, where the id of the asset node is a unique id of the article maintained by the publisher.
 * @param origin publisher name
 * @param articleId unique id of the article maintained by the publisher
 * @param ogNodeId original material nodeId which is created when a publisher is onboarded an registered on the protocol
 * @returns Promise<string> article node id
 */
export const createArticleNode = withErrorHandlingGraph(
  async (
    origin: string,
    articleId: string,
    ogNodeId: string
  ): Promise<string> => {
    const nodeId = hashData(`${origin}${articleId}`)
    let articleNode: ContentGraphNode | undefined
    debugLogger().debug(`check if article node exists`)
    try {
      articleNode = await getNode(nodeId)
    } catch (error) {
      debugLogger().debug(`article node does not exist`)
    }

    if (!articleNode) {
      debugLogger().debug(`create article node ${nodeId}`)
      const ZeroHash =
        '0x0000000000000000000000000000000000000000000000000000000000000000'
      await createNode({
        id: nodeId,
        parentId: ogNodeId,
        nodeType: NodeType.ORG,
        referenceOf: ZeroHash
      })
    }

    return nodeId
  }
)

/**
 * Creates an org node under the given the root wallet address.
 * @param {string} rootWalletAddress - The address of the root wallet.
 * @returns {Promise<{org: {
 *  id: string
 *  txnHash: string
 * }}>} A promise that resolves with the org node id and transaction hash.
 */
export const createOrgNode = withErrorHandlingGraph(
  async (
    rootWalletAddress: string
  ): Promise<{
    org: {
      id: string
      txnHash: string
    }
  }> => {
    let incrBy = 1
    const ZeroHash =
      '0x0000000000000000000000000000000000000000000000000000000000000000'
    // create org node
    const nodesCreated = (
      (await getNodesCreated(rootWalletAddress)).toNumber() + incrBy
    ).toString()

    debugLogger().debug(`nodes created ${rootWalletAddress}`)
    debugLogger().debug(nodesCreated)

    const orgId = ethers.utils.solidityKeccak256(
      ['address', 'uint256'],
      [rootWalletAddress, nodesCreated]
    )

    debugLogger().debug(`creating org node with orgId ${orgId}`)
    let orgTransaction = null
    try {
      orgTransaction = await createNode({
        id: orgId,
        parentId: ZeroHash,
        nodeType: NodeType.ORG,
        referenceOf: ZeroHash
      })
    } catch (error) {
      if ((error as VerifyError).data === PROTOCOL_ERRORS.NODE_EXISTS) {
        incrBy = incrBy + 1
        debugLogger().debug('org node already exists')
      } else {
        throw error
      }
    }

    debugLogger().debug('org node created')
    debugLogger().debug(orgTransaction?.transactionHash)

    return {
      org: {
        id: orgId,
        txnHash: orgTransaction?.transactionHash || ''
      }
    }
  }
)

/**
 * Creates an org node node under the given org node.
 * @param orgNode - Publishers Organization node id.
 * @param id - The id of the node.
 * @param parentId - The parent id of the node. {@link NodeType} NodeType.ORG
 */
export const createHierarchicalNode = withErrorHandlingGraph(
  async (orgNode: string, id: string, parentId: string): Promise<string> => {
    const ZeroHash =
      '0x0000000000000000000000000000000000000000000000000000000000000000'

    if (!id) {
      throw new Error('id is required basis which the node will be created')
    }

    const nodeId = hashData(trimLowerCase(`${orgNode}_${id}`))
    try {
      await getNode(nodeId)
      debugLogger().debug(`${id} node already exists`)
    } catch (error) {
      debugLogger().debug(`creating ${id} node`)
      // create license node under org node
      await createNode({
        id: nodeId,
        parentId: parentId.toString(),
        nodeType: NodeType.ORG,
        referenceOf: ZeroHash
      })
    }

    return nodeId
  }
)

/**
 * Gets the asset details and the hierarchy with which it has been stored on chain for the given asset id.
 * @param assetId
 * @param ipfsGateway ipfs gateway url in case a self hosted or a public ipfs gateway is used. Default is ''
 * @param pinataConfig pinata configuration object containing pinataKey and pinataSecret
 * @returns {Promise<AssetDetails>} a promise that resolves with the asset details as stored on chain
 */
export async function getAssetDetails(
  assetId: string,
  ipfsGateway = '',
  pinataConfig?: PinataConfig
): Promise<AssetDetails> {
  debugLogger().debug(`get node for ${assetId}`)
  let currentNode = await getNode(assetId)
  let assetMeta: AssetNode | undefined
  if (pinataConfig?.pinataKey && pinataConfig?.pinataSecret) {
    debugLogger().debug(`fetch from pinata ${currentNode.uri}`)
    assetMeta = (await fetchFileFromPinata(
      currentNode.uri,
      'meta',
      pinataConfig
    )) as AssetNode
  } else {
    debugLogger().debug(`fetch from ipfs ${currentNode.uri}`)
    assetMeta = (await fetchFromIPFS(
      currentNode.uri,
      'meta',
      ipfsGateway
    )) as AssetNode
  }

  const assetUri = assetMeta.data.locations.filter((location) => {
    return (
      location.protocol === 'ipfs' ||
      location.protocol === 'https' ||
      location.protocol === 's3'
    )
  })[0].uri

  const assetType = assetMeta.data.type

  debugLogger().debug(`get asset type ${assetType} from ${assetUri}`)

  const assetDetails: AssetDetails = {
    assetId,
    meta: assetMeta,
    type: assetType,
    location: assetUri,
    orgStruct: []
  }
  // eslint-disable-next-line no-constant-condition
  while (true) {
    debugLogger().debug(`get parent of ${currentNode.token.toString()}`)
    const parentId = await parentOf(currentNode.token.toString())
    if (parentId === '0') {
      debugLogger().debug(`reached root node`)
      break
    }
    debugLogger().debug(`get token to node for ${parentId}`)
    currentNode = await tokenToNode(parentId)
    assetDetails.orgStruct.push(currentNode.id.toString())
  }
  assetDetails.orgStruct = assetDetails.orgStruct.reverse()

  debugLogger().debug(`asset details ${JSON.stringify(assetDetails)}`)

  return assetDetails
}

/**
 * Gets the details of all children nodes of an article node. This represents the provenance of the article.
 * @param articleId article node id
 * @param ipfsGateway ipfs gateway url in case a self hosted or a public ipfs gateway is used. Default is ''
 * @param pinataConfig pinata configuration object containing pinataKey and pinataSecret
 * @returns {Promise<AssetNode[]>} a promise that resolves with all children nodes of an article node
 */
export async function getArticleProvenance(
  articleId: string,
  ipfsGateway: string,
  pinataConfig?: PinataConfig
): Promise<AssetNode[]> {
  debugLogger().debug(`get node for ${articleId}`)
  const currentNode = await getNode(articleId)
  debugLogger().debug(`get children of ${currentNode.token.toString()}`)
  const childIds = await childrenOf(currentNode.token.toString())
  const promises = childIds.map(async (childId: string) => {
    const node = await tokenToNode(childId.toString())
    if (pinataConfig?.pinataKey && pinataConfig?.pinataSecret) {
      debugLogger().debug(`fetch from pinata ${node.uri}`)

      return (await fetchFileFromPinata(
        node.uri,
        'meta',
        pinataConfig
      )) as AssetNode
    } else {
      debugLogger().debug(`fetch from ipfs ${node.uri}`)

      return (await fetchFromIPFS(node.uri, 'meta', ipfsGateway)) as AssetNode
    }
  })

  return await Promise.all(promises)
}

/**
 * Returns the signer wallet balance
 * @returns {Promise<BigNumber>} A promise that resolves with the balance of the wallet.
 */
export const getWalletBalance = async (): Promise<BigNumber> => {
  let balance: BigNumber | undefined = undefined
  const wallet = getWalletInstance()
  balance = await wallet.provider.getBalance(wallet.address)

  return balance
}
