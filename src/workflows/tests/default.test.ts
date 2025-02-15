import {
  mockNodeData,
  mockNodesCreated,
  mockTransactionResponse,
  mockArticle
} from '../../__fixtures__/data'
import { init } from '../../utils/config'
import fetchMock from 'jest-fetch-mock'
import { publishAssets } from '../default'
import { LicenseType } from '../../types/app'

init({
  stage: 'sandbox',
  pvtKey: '',
  rpcUrl: 'xyz',
  chainId: 1,
  chain: 'amoy',
  maxGasPrice: 2000000000000,
  walletExpiryDays: 1
})

const mockGasPrice = jest.fn()
const mockTotalSupply = 500
const mockAddress = '0x123'
const mockRootAddress = '0x706Fe724eA8F05928e5Fce8fAd5584061FE586ec'
const mockWait = jest.fn()
const mockPublish = jest.fn()
const mockCreateNode = jest.fn()
const mockPublishBulk = jest.fn()
const mockNodesCreatedFn = jest.fn().mockImplementation(() => mockNodesCreated)
const mockGetNode = jest.fn().mockImplementation(() => {
  throw new Error('node not found')
})
const mockParentOf = jest.fn()
const mockChildrenOf = jest.fn()

jest.mock('@lit-protocol/lit-node-client', () => {
  return {
    LitNodeClient: jest.fn().mockImplementation(() => {
      return {
        disconnect: jest.fn().mockResolvedValue(true),
        connect: jest.fn().mockResolvedValue(true),
        ready: true,
        config: {
          litNetwork: 'cayenne'
        }
      }
    }),
    encryptFile: jest.fn().mockResolvedValue(
      Promise.resolve({
        ciphertext: 'ciphertext',
        dataToEncryptHash: 'dataToEncryptHash'
      })
    ),
    decryptToFile: jest
      .fn()
      .mockResolvedValue(Promise.resolve(new Uint8Array([1, 2, 3, 4])))
  }
})

jest.mock('ethers', () => {
  const original = jest.requireActual('ethers')

  return {
    ...original,
    utils: {
      ...jest.requireActual('ethers').utils,
      verifyMessage: jest.fn().mockImplementation(() => mockAddress)
    },
    Wallet: jest.fn().mockImplementation(() => ({
      address: mockRootAddress,
      signMessage: jest.fn().mockImplementation(() => 'mockSignature'),
      provider: {
        getGasPrice: mockGasPrice
      }
    })),
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      /* Mock properties and methods here */
    })),
    Contract: jest.fn().mockImplementation(() => ({
      getNode: mockGetNode,
      totalSupply: jest.fn().mockImplementation(() => mockTotalSupply),
      tokenToNode: jest.fn().mockImplementation(() => mockNodeData),
      whoIs: jest.fn().mockImplementation(() => mockRootAddress),
      auth: jest.fn().mockImplementation(() => true),
      refAuth: jest.fn().mockImplementation(() => true),
      nodesCreated: mockNodesCreatedFn,
      parentOf: mockParentOf,
      childrenOf: mockChildrenOf,
      publish: mockPublish.mockImplementation(() => ({
        wait: mockWait
      })),
      publishBulk: mockPublishBulk.mockImplementation(() => ({
        wait: mockWait
      })),
      createNode: mockCreateNode.mockImplementation(() => ({
        wait: mockWait
      })),
      move: jest.fn().mockImplementation(() => mockTransactionResponse),
      setAccessAuth: jest
        .fn()
        .mockImplementation(() => mockTransactionResponse),
      setReferenceAuth: jest
        .fn()
        .mockImplementation(() => mockTransactionResponse),
      setURI: jest.fn().mockImplementation(() => mockTransactionResponse)
    }))
  }
})

describe('publishAssets', () => {
  beforeEach(() => {
    fetchMock.enableMocks()
  })

  afterEach(() => {
    fetchMock.resetMocks()
  })

  const contents = mockArticle.contents
  const ipfsConfig = {
    pinataKey: 'mockPinataKey',
    pinataSecret: 'mockPinataSecret'
  }
  const org = {
    orgNodeId: 'mockOrgNodeId',
    ogNodeId: 'mockOgNodeId'
  }

  it('should publish assets', async () => {
    fetchMock.mockResponse(
      JSON.stringify({
        IpfsHash: 'mockIpfsHash',
        PinSize: 1,
        Timestamp: 'mockTimestamp'
      })
    )

    const result = await publishAssets(
      contents,
      ipfsConfig,
      org.orgNodeId,
      LicenseType.public
    )
    expect(result).toHaveLength(2)
  })
})
