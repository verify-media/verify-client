export const AUTHORIZER_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'graph',
        type: 'address'
      },
      {
        internalType: 'address',
        name: 'identity',
        type: 'address'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    inputs: [],
    name: 'NotAuthorized',
    type: 'error'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'id',
        type: 'bytes32'
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'expression',
        type: 'string'
      },
      {
        indexed: false,
        internalType: 'address[]',
        name: 'authContracts',
        type: 'address[]'
      }
    ],
    name: 'AuthorizationSet',
    type: 'event'
  },
  {
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
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256'
      }
    ],
    name: 'getNode',
    outputs: [
      {
        internalType: 'enum Authorizer.Operators',
        name: '',
        type: 'uint8'
      },
      {
        internalType: 'address',
        name: '',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'id',
        type: 'bytes32'
      }
    ],
    name: 'getRoot',
    outputs: [
      {
        internalType: 'enum Authorizer.Operators',
        name: '',
        type: 'uint8'
      },
      {
        internalType: 'address',
        name: '',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'id',
        type: 'bytes32'
      },
      {
        internalType: 'string',
        name: 'expression',
        type: 'string'
      },
      {
        internalType: 'address[]',
        name: 'authContracts',
        type: 'address[]'
      }
    ],
    name: 'setAuth',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

enum Operators {
  NOT,
  AND,
  OR
}

export type ExpressionNode = {
  Operators: Operators
  address: string
  left: number
  right: number
}
