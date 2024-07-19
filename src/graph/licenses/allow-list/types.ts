export const ALLOW_LIST_ABI = [
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
        internalType: 'address',
        name: 'user',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'state',
        type: 'bool'
      }
    ],
    name: 'UserStateUpdated',
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
        name: 'isAuthorised',
        type: 'bool'
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
        internalType: 'address',
        name: 'user',
        type: 'address'
      },
      {
        internalType: 'bool',
        name: 'state',
        type: 'bool'
      }
    ],
    name: 'setState',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]
