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
import { BigNumber, ContractInterface } from 'ethers'
import { AssetNode } from '../../../types/schema'

/**
 * @hidden
 */
export type CreateContentNodeParams = {
  graphContractAddress: string
  parentId: string
  references: string[]
}

export type PublishParam = {
  id: string
  referenceOf: string
  uri: string
}

/**
 * @hidden
 */
export type ContentNode = PublishParam & {
  nodeType: NodeType.ASSET
}

/**
 * @hidden
 */
export type RefContentNode = PublishParam & {
  nodeType: NodeType.REFERENCE
}

/**
 * @remarks
 * type definition for node on verify protocol
 */
export type Node = {
  id: string
  parentId: string
  nodeType: NodeType
  referenceOf: string
}

export type AssetDetails = {
  assetId: string
  type: string
  meta: AssetNode
  location: string
  orgStruct: string[]
}

export type OrgStruct = {
  org: {
    id: string
    txnHash: string
  }
  originalMaterial: {
    id: string
    txnHash: string
  }
}

/**
 * @hidden
 */
export type ContentNodes = Array<ContentNode>

export type PublishParams = Array<PublishParam>

/**
 * @remarks
 * type of nodes stored on verify protocol
 */
export enum NodeType {
  ORG,
  REFERENCE,
  ASSET
}

/**
 * @remarks
 * type definition for node on verify protocol
 */
export type ContentGraphNode = {
  token: BigNumber
  nodeType: NodeType
  id: string
  referenceOf: string
  uri: string
  accessAuth: string // Assuming address is represented as a string for simplicity
  referenceAuth: string // Assuming address is represented as a string for simplicity
}

/**
 * @hidden
 */
export const GRAPH_V2_ABI = [
  { inputs: [], name: 'InvalidParams', type: 'error' },
  { inputs: [], name: 'NodeAlreadyExists', type: 'error' },
  { inputs: [], name: 'NodeDoesNotExist', type: 'error' },
  { inputs: [], name: 'NotAuthorized', type: 'error' },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: '_id', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: '_auth', type: 'address' }
    ],
    name: 'AccessAuthUpdate',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'approved',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      }
    ],
    name: 'Approval',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'operator',
        type: 'address'
      },
      { indexed: false, internalType: 'bool', name: 'approved', type: 'bool' }
    ],
    name: 'ApprovalForAll',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint8', name: 'version', type: 'uint8' }
    ],
    name: 'Initialized',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'minter',
        type: 'address'
      },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'parentId',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      }
    ],
    name: 'Minted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: '_id', type: 'bytes32' },
      {
        indexed: true,
        internalType: 'bytes32',
        name: '_from',
        type: 'bytes32'
      },
      { indexed: true, internalType: 'bytes32', name: '_to', type: 'bytes32' }
    ],
    name: 'Moved',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: '_id', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: '_auth', type: 'address' }
    ],
    name: 'ReferenceAuthUpdate',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256'
      }
    ],
    name: 'Transfer',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: '_id', type: 'bytes32' },
      { indexed: true, internalType: 'string', name: '_uri', type: 'string' }
    ],
    name: 'URIUpdate',
    type: 'event'
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'id', type: 'bytes32' },
      { internalType: 'address', name: 'user', type: 'address' }
    ],
    name: 'auth',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'childrenOf',
    outputs: [
      { internalType: 'uint256[]', name: 'childrenIds', type: 'uint256[]' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'id', type: 'bytes32' },
      { internalType: 'bytes32', name: 'parentId', type: 'bytes32' },
      {
        internalType: 'enum ContentGraph.NodeType',
        name: 'nodeType',
        type: 'uint8'
      },
      { internalType: 'bytes32', name: 'referenceOf', type: 'bytes32' }
    ],
    name: 'createNode',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'id', type: 'bytes32' }],
    name: 'getNode',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'token', type: 'uint256' },
          {
            internalType: 'enum ContentGraph.NodeType',
            name: 'nodeType',
            type: 'uint8'
          },
          { internalType: 'bytes32', name: 'id', type: 'bytes32' },
          { internalType: 'bytes32', name: 'referenceOf', type: 'bytes32' },
          { internalType: 'string', name: 'uri', type: 'string' },
          { internalType: 'address', name: 'accessAuth', type: 'address' },
          { internalType: 'address', name: 'referenceAuth', type: 'address' }
        ],
        internalType: 'struct ContentGraph.Node',
        name: 'node',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'string', name: 'name_', type: 'string' },
      { internalType: 'string', name: 'symbol_', type: 'string' },
      { internalType: 'address', name: '_identity', type: 'address' }
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'operator', type: 'address' }
    ],
    name: 'isApprovedForAll',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'isLeaf',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'isRoot',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'id', type: 'bytes32' },
      { internalType: 'bytes32', name: 'newParentId', type: 'bytes32' }
    ],
    name: 'move',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'nodesCreated',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'parentOf',
    outputs: [{ internalType: 'uint256', name: 'parentId', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'parentId', type: 'bytes32' },
      {
        components: [
          { internalType: 'bytes32', name: 'id', type: 'bytes32' },
          {
            internalType: 'enum ContentGraph.NodeType',
            name: 'nodeType',
            type: 'uint8'
          },
          { internalType: 'bytes32', name: 'referenceOf', type: 'bytes32' },
          { internalType: 'string', name: 'uri', type: 'string' }
        ],
        internalType: 'struct ContentGraph.ContentNode',
        name: 'content',
        type: 'tuple'
      }
    ],
    name: 'publish',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'parentId', type: 'bytes32' },
      {
        components: [
          { internalType: 'bytes32', name: 'id', type: 'bytes32' },
          {
            internalType: 'enum ContentGraph.NodeType',
            name: 'nodeType',
            type: 'uint8'
          },
          { internalType: 'bytes32', name: 'referenceOf', type: 'bytes32' },
          { internalType: 'string', name: 'uri', type: 'string' }
        ],
        internalType: 'struct ContentGraph.ContentNode[]',
        name: 'content',
        type: 'tuple[]'
      }
    ],
    name: 'publishBulk',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'id', type: 'bytes32' },
      { internalType: 'address', name: 'user', type: 'address' }
    ],
    name: 'refAuth',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' }
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'bytes', name: 'data', type: 'bytes' }
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'id', type: 'bytes32' },
      { internalType: 'address', name: 'accessAuth', type: 'address' }
    ],
    name: 'setAccessAuth',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'operator', type: 'address' },
      { internalType: 'bool', name: 'approved', type: 'bool' }
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'id', type: 'bytes32' },
      { internalType: 'address', name: 'referenceAuth', type: 'address' }
    ],
    name: 'setReferenceAuth',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'id', type: 'bytes32' },
      { internalType: 'string', name: 'uri', type: 'string' }
    ],
    name: 'setURI',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'token', type: 'uint256' }],
    name: 'tokenToNode',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'token', type: 'uint256' },
          {
            internalType: 'enum ContentGraph.NodeType',
            name: 'nodeType',
            type: 'uint8'
          },
          { internalType: 'bytes32', name: 'id', type: 'bytes32' },
          { internalType: 'bytes32', name: 'referenceOf', type: 'bytes32' },
          { internalType: 'string', name: 'uri', type: 'string' },
          { internalType: 'address', name: 'accessAuth', type: 'address' },
          { internalType: 'address', name: 'referenceAuth', type: 'address' }
        ],
        internalType: 'struct ContentGraph.Node',
        name: 'node',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' }
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as ContractInterface
