import { BigNumber } from 'ethers'

export const TIMEBASED_LICENSE_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_graph',
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
        name: 'purchaser',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'price',
        type: 'uint256'
      }
    ],
    name: 'AccessPurchased',
    type: 'event'
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
        internalType: 'uint256',
        name: 'embargoDate',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'retailPrice',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'premium',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'enum TimeBased.Time',
        name: 'timeDenom',
        type: 'uint8'
      },
      {
        indexed: false,
        internalType: 'enum TimeBased.PricingFunction',
        name: 'priceFunc',
        type: 'uint8'
      }
    ],
    name: 'EmbargoSet',
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
        name: 'isAuthorized',
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
      }
    ],
    name: 'getEmbargo',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'embargoDate',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'retailPrice',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'premium',
            type: 'uint256'
          },
          {
            internalType: 'enum TimeBased.Time',
            name: 'timeDenom',
            type: 'uint8'
          },
          {
            internalType: 'enum TimeBased.PricingFunction',
            name: 'priceFunc',
            type: 'uint8'
          }
        ],
        internalType: 'struct TimeBased.Embargo',
        name: 'embargo',
        type: 'tuple'
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
        internalType: 'uint256',
        name: 'time',
        type: 'uint256'
      }
    ],
    name: 'price',
    outputs: [
      {
        internalType: 'uint256',
        name: 'accessPrice',
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
    name: 'purchaseAccess',
    outputs: [],
    stateMutability: 'payable',
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
        components: [
          {
            internalType: 'uint256',
            name: 'embargoDate',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'retailPrice',
            type: 'uint256'
          },
          {
            internalType: 'uint256',
            name: 'premium',
            type: 'uint256'
          },
          {
            internalType: 'enum TimeBased.Time',
            name: 'timeDenom',
            type: 'uint8'
          },
          {
            internalType: 'enum TimeBased.PricingFunction',
            name: 'priceFunc',
            type: 'uint8'
          }
        ],
        internalType: 'struct TimeBased.Embargo',
        name: '_embargo',
        type: 'tuple'
      }
    ],
    name: 'setEmbargo',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

export enum EmbargoTime {
  MINS,
  DAYS,
  WEEKS,
  YEARS
}

export enum EmbargoPricingFunction {
  STEP,
  LINEAR,
  EXPONENTIAL,
  BINARY
}

export type Embargo = {
  embargoDate: BigNumber
  retailPrice: BigNumber
  premium: BigNumber
  timeDenom: EmbargoTime
  priceFunc: EmbargoPricingFunction
}
