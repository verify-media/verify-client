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
import {
  Article,
  AssetNode,
  AssetNodeData,
  ContentTypes,
  LocationProtocol,
  MIME_TYPES,
  Signature
} from '../types/schema'
import { BigNumber, ethers } from 'ethers'

export const assetNode: AssetNodeData = {
  type: 'text/html',
  description: 'test description',
  encrypted: true,
  access: {
    'lit-protocol': {
      version: 'v3'
    }
  },
  locations: [
    {
      protocol: LocationProtocol.IPFS,
      uri: 'ipfs://bafkreibffjveulscu6vpp7w6mdlsbha2zyyhdt6zgtafgldghsydcrz5xm'
    },
    {
      protocol: LocationProtocol.HTTPS,
      uri: 'https://npwf-dev-onchain/v2/0xc46c96f13a8a9f8b3ce4cf0a373d21fc6a9dee207a3d8935593d03e3bf41b0ea'
    }
  ],
  manifest: {
    uri: 'https://verifymedia.com',
    title: 'Dev2 test',
    description: 'test data',
    creditedSource: 'FOX',
    signingOrg: {
      name: 'FOX',
      unit: 'FOXNEWS'
    },
    published: '2023-11-09T20:59:31.000Z',
    history: []
  },
  contentBinding: {
    algo: 'keccak256',
    hash: '0xc46c96f13a8a9f8b3ce4cf0a373d21fc6a9dee207a3d8935593d03e3bf41b0ea'
  }
}

const mockSignature: Signature = {
  curve: 'mockCurve',
  signature: 'mockSignature',
  message: 'mockMessage',
  description: 'mockDescription'
}

export const AssetNodeWithSign: AssetNode = {
  version: '1.0.0',
  data: assetNode,
  signature: mockSignature
}

export const mockHighGasPrice = BigNumber.from(30000000000000)
export const mockLowGasPrice = BigNumber.from(100000000000)
export const mockDefaultGasPrice = BigNumber.from(2000000000000)
export const mockNoGasPrice = BigNumber.from(0)
export const mockNodesCreated = BigNumber.from(1)
export const mockUnit8Array = new Uint8Array([1, 2, 3, 4])

export const mockPinataResponse = {
  IpfsHash: 'mockIpfsHash',
  PinSize: 1,
  Timestamp: 'mockTimestamp'
}

export const mockNodeData = {
  token: BigNumber.from(1234),
  nodeType: '2',
  id: '0x0000000000000000000000000000000000000000000000000000000000000000',
  uri: 'ipfs://bafkreiau66agu7lrhbwmkupkbowb5qjm2ea3vcsp2galaljtoiznmxdb7e',
  referenceOf:
    '0x0000000000000000000000000000000000000000000000000000000000000000',
  accessAuth: '0x1234',
  referenceAuth: '0x5678'
}

export const mockTransactionResponse: ethers.providers.TransactionResponse = {
  hash: '0x1234',
  confirmations: 0,
  from: '0x1234',
  nonce: 0,
  gasLimit: BigNumber.from('0x1234'),
  gasPrice: BigNumber.from('0x1234'),
  data: '0x',
  value: BigNumber.from('0x1234'),
  chainId: 1,
  wait: jest.fn().mockImplementation(() =>
    Promise.resolve({
      to: '0x1234',
      from: '0x1234',
      contractAddress: '0x1234',
      transactionIndex: 0,
      gasUsed: BigNumber.from('0x1234'),
      logsBloom: '0x1234',
      blockHash: '0x1234',
      transactionHash: '0x1234',
      logs: [],
      blockNumber: 0,
      confirmations: 0,
      cumulativeGasUsed: BigNumber.from('0x1234'),
      byzantium: true,
      status: 1
    })
  )
}

export const PublishedAsset: AssetNode = {
  version: '1.0.0',
  data: {
    description: 'sandbox sample string',
    type: 'image/jpg',
    encrypted: true,
    access: {
      'lit-protocol': {
        version: 'v3'
      }
    },
    locations: [
      {
        protocol: LocationProtocol.IPFS,
        uri: 'ipfs://bafkreiau66agu7lrhbwmkupkbowb5qjm2ea3vcsp2galaljtoiznmxdb7e'
      }
    ],
    manifest: {
      uri: 'https://verifymedia.com',
      title: 'sandbox sample title',
      creditedSource: 'verifymedia',
      signingOrg: {
        name: 'FOX',
        unit: 'FOX'
      },
      history: [],
      published: '2023-12-20T14:14:48.310Z'
    },
    contentBinding: {
      algo: 'keccak256',
      hash: '0x530fd0f87ab05a6096e7eba481f4e8403bd174017d983d12d7d41af9b7d61abe'
    }
  },
  signature: {
    curve: 'sepc256k1',
    signature:
      '0xa6c587c44da488a416ac6086b58319c1d9b5a0f573548aa9f56ea429a1384ea6775be5230f2f156d684948b2cd01df49615e14141f547aed5bf394ef480261cc1b',
    message:
      '0x5d6d2fbfac7553bfb53f23cb84640f06c76667ad0754a3af17a097e2cb285346',
    description:
      'hex encoded sepc256k1 signature of the keccak256 hash of content field with the signers private key'
  }
}

function generateRandomString(len: number): string {
  let result = ''
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i: number = 0; i < len; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }

  return result
}

const origin = 'test-origin'
export const mockArticle: Article = {
  metadata: {
    title: 'some headline',
    description: 'some description',
    uri: 'https://somepublisher.com/somearticle',
    origin: origin,
    datePublished: new Date().toISOString(),
    dateCreated: '2023-09-28T18:53:03.000Z',
    dateUpdated: '2023-09-28T20:18:52.000Z',
    authority: { name: 'FOX', contact: origin },
    id: generateRandomString(12)
  },
  contents: [
    {
      published: new Date().toISOString(),
      type: ContentTypes.IMAGE,
      contentType: MIME_TYPES.JPG,
      description: 'some headline',
      alt: 'some alt tag',
      caption: 'some caption',
      uri: 'https://fastly.picsum.photos/id/733/200/300.jpg?hmac=JYkTVVdGOo8BnLPxu1zWliHFvwXKurY-uTov5YiuX2s',
      creditedSource: 'Jennifer Mitchell for Fox News Digital/ pool ',
      authority: { name: 'FOX', contact: origin },
      id: generateRandomString(12),
      title: 'some headline',
      metadata: {},
      ownership: 'licensed',
      licensedFrom: 'getty'
    },
    {
      published: new Date().toISOString(),
      type: ContentTypes.TEXT,
      body: `randomness ${generateRandomString(8)}`,
      contentType: MIME_TYPES.TEXT,
      description: 'some description',
      creditedSource: 'FOX',
      authority: { name: 'FOX', contact: origin },
      id: generateRandomString(12),
      title: 'some headline',
      uri: 'https://somepublisher.com/somearticle',
      metadata: {},
      ownership: 'owned',
      licensedFrom: ''
    }
  ]
}

export const mockAssetDetails = {
  assetId: '0x1234',
  meta: {
    version: '1.0.0',
    data: {
      description: 'sandbox sample string',
      type: 'image/jpg',
      encrypted: true,
      access: {
        'lit-protocol': {
          version: 'v3'
        }
      },
      locations: [
        {
          protocol: 'ipfs',
          uri: 'ipfs://bafkreiau66agu7lrhbwmkupkbowb5qjm2ea3vcsp2galaljtoiznmxdb7e'
        }
      ],
      manifest: {
        uri: 'https://verifymedia.com',
        title: 'sandbox sample title',
        creditedSource: 'verifymedia',
        signingOrg: {
          name: 'FOX',
          unit: 'FOX'
        },
        history: [],
        published: '2023-12-20T14:14:48.310Z'
      },
      contentBinding: {
        algo: 'keccak256',
        hash: 'differentHash'
      }
    },
    signature: {
      curve: 'sepc256k1',
      signature:
        '0xa6c587c44da488a416ac6086b58319c1d9b5a0f573548aa9f56ea429a1384ea6775be5230f2f156d684948b2cd01df49615e14141f547aed5bf394ef480261cc1b',
      message:
        '0x5d6d2fbfac7553bfb53f23cb84640f06c76667ad0754a3af17a097e2cb285346',
      description:
        'hex encoded sepc256k1 signature of the keccak256 hash of content field with the signers private key'
    }
  },
  type: 'image/jpg',
  location:
    'ipfs://bafkreiau66agu7lrhbwmkupkbowb5qjm2ea3vcsp2galaljtoiznmxdb7e',
  orgStruct: [
    '0x0000000000000000000000000000000000000000000000000000000000000000'
  ]
}

export const mockArticleProvenance = [
  {
    version: '1.0.0',
    data: {
      description: 'sandbox sample string',
      type: 'image/jpg',
      encrypted: true,
      access: {
        'lit-protocol': {
          version: 'v3'
        }
      },
      locations: [
        {
          protocol: 'ipfs',
          uri: 'ipfs://bafkreiau66agu7lrhbwmkupkbowb5qjm2ea3vcsp2galaljtoiznmxdb7e'
        }
      ],
      manifest: {
        uri: 'https://verifymedia.com',
        title: 'sandbox sample title',
        creditedSource: 'verifymedia',
        signingOrg: {
          name: 'FOX',
          unit: 'FOX'
        },
        history: [],
        published: '2023-12-20T14:14:48.310Z'
      },
      contentBinding: {
        algo: 'keccak256',
        hash: 'differentHash'
      }
    },
    signature: {
      curve: 'sepc256k1',
      signature:
        '0xa6c587c44da488a416ac6086b58319c1d9b5a0f573548aa9f56ea429a1384ea6775be5230f2f156d684948b2cd01df49615e14141f547aed5bf394ef480261cc1b',
      message:
        '0x5d6d2fbfac7553bfb53f23cb84640f06c76667ad0754a3af17a097e2cb285346',
      description:
        'hex encoded sepc256k1 signature of the keccak256 hash of content field with the signers private key'
    }
  },
  {
    version: '1.0.0',
    data: {
      description: 'sandbox sample string',
      type: 'image/jpg',
      encrypted: true,
      access: {
        'lit-protocol': {
          version: 'v3'
        }
      },
      locations: [
        {
          protocol: 'ipfs',
          uri: 'ipfs://bafkreiau66agu7lrhbwmkupkbowb5qjm2ea3vcsp2galaljtoiznmxdb7e'
        }
      ],
      manifest: {
        uri: 'https://verifymedia.com',
        title: 'sandbox sample title',
        creditedSource: 'verifymedia',
        signingOrg: {
          name: 'FOX',
          unit: 'FOX'
        },
        history: [],
        published: '2023-12-20T14:14:48.310Z'
      },
      contentBinding: {
        algo: 'keccak256',
        hash: 'differentHash'
      }
    },
    signature: {
      curve: 'sepc256k1',
      signature:
        '0xa6c587c44da488a416ac6086b58319c1d9b5a0f573548aa9f56ea429a1384ea6775be5230f2f156d684948b2cd01df49615e14141f547aed5bf394ef480261cc1b',
      message:
        '0x5d6d2fbfac7553bfb53f23cb84640f06c76667ad0754a3af17a097e2cb285346',
      description:
        'hex encoded sepc256k1 signature of the keccak256 hash of content field with the signers private key'
    }
  },
  {
    version: '1.0.0',
    data: {
      description: 'sandbox sample string',
      type: 'image/jpg',
      encrypted: true,
      access: {
        'lit-protocol': {
          version: 'v3'
        }
      },
      locations: [
        {
          protocol: 'ipfs',
          uri: 'ipfs://bafkreiau66agu7lrhbwmkupkbowb5qjm2ea3vcsp2galaljtoiznmxdb7e'
        }
      ],
      manifest: {
        uri: 'https://verifymedia.com',
        title: 'sandbox sample title',
        creditedSource: 'verifymedia',
        signingOrg: {
          name: 'FOX',
          unit: 'FOX'
        },
        history: [],
        published: '2023-12-20T14:14:48.310Z'
      },
      contentBinding: {
        algo: 'keccak256',
        hash: 'differentHash'
      }
    },
    signature: {
      curve: 'sepc256k1',
      signature:
        '0xa6c587c44da488a416ac6086b58319c1d9b5a0f573548aa9f56ea429a1384ea6775be5230f2f156d684948b2cd01df49615e14141f547aed5bf394ef480261cc1b',
      message:
        '0x5d6d2fbfac7553bfb53f23cb84640f06c76667ad0754a3af17a097e2cb285346',
      description:
        'hex encoded sepc256k1 signature of the keccak256 hash of content field with the signers private key'
    }
  }
]
