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
/* eslint-disable @typescript-eslint/explicit-function-return-type */

export const getContentAuth = (
  id: string,
  index: string,
  chain: string,
  contractAddress: string
) => {
  return [
    {
      conditionType: 'evmContract',
      contractAddress: contractAddress,
      chain: chain,
      functionName: 'authContent',
      functionAbi: {
        inputs: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'uint256', name: 'contentIndex', type: 'uint256' },
          { internalType: 'address', name: 'user', type: 'address' }
        ],
        name: 'authContent',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function'
      },
      functionParams: [id, index, ':userAddress'],
      returnValueTest: {
        key: '',
        comparator: '=',
        value: 'true'
      }
    }
  ]
}

export declare type ConditionType =
  | 'solRpc'
  | 'evmBasic'
  | 'evmContract'
  | 'cosmos'

export const getDefaultAuth = (
  id: string,
  chain: string,
  contractAddress: string
) => {
  return [
    {
      conditionType: 'evmContract' as ConditionType,
      contractAddress: contractAddress,
      chain: chain,
      functionName: 'auth',
      functionAbi: {
        inputs: [
          {
            internalType: 'bytes32',
            name: 'id',
            type: 'bytes32'
          },
          {
            internalType: 'address',
            name: 'user',
            type: 'address'
          }
        ],
        name: 'auth',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool'
          }
        ],
        stateMutability: 'view',
        type: 'function'
      },
      functionParams: [id, ':userAddress'],
      returnValueTest: {
        key: '',
        comparator: '=',
        value: 'true'
      }
    },
    { operator: 'or' },
    {
      conditionType: 'evmContract' as ConditionType,
      contractAddress: contractAddress,
      chain: chain,
      functionName: 'refAuth',
      functionAbi: {
        inputs: [
          {
            internalType: 'bytes32',
            name: 'id',
            type: 'bytes32'
          },
          {
            internalType: 'address',
            name: 'user',
            type: 'address'
          }
        ],
        name: 'refAuth',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool'
          }
        ],
        stateMutability: 'view',
        type: 'function'
      },
      functionParams: [id, ':userAddress'],
      returnValueTest: {
        key: '',
        comparator: '=',
        value: 'true'
      }
    }
  ]
}

export const mockAccessControlConditions = [
  {
    conditionType: 'mockConditionType',
    contractAddress: 'mockContractAddress',
    chain: 'mockChain',
    functionName: 'mockFunctionName',
    functionAbi: {
      inputs: [
        {
          internalType: 'mockInternalType',
          name: 'mockName',
          type: 'mockType'
        }
      ],
      name: 'mockName',
      outputs: [
        {
          internalType: 'mockInternalType',
          name: 'mockName',
          type: 'mockType'
        }
      ],
      stateMutability: 'mockStateMutability',
      type: 'mockType'
    },
    functionParams: ['mockParam1', 'mockParam2'],
    returnValueTest: {
      key: 'mockKey',
      comparator: 'mockComparator',
      value: 'mockValue'
    }
  }
]
