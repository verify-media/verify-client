import {
  getContractInstance,
  setPurchaseAccess,
  setEmbargo,
  checkAuth,
  getEmbargo,
  getAssetPrice
} from '../index'
import { init } from '../../../../utils/config'
import { BigNumber, Contract, Wallet, ethers } from 'ethers'
import {
  Embargo,
  EmbargoPricingFunction,
  EmbargoTime,
  TIMEBASED_LICENSE_ABI
} from '../types'
import {
  mockDefaultGasPrice,
  // mockNodeData,
  mockTransactionResponse
} from '../../../../__fixtures__/data'
import { getLicense } from '../../../../constants'
import { LicenseType } from '../../../../types/app'

const mockRootAddress = '0x706Fe724eA8F05928e5Fce8fAd5584061FE586ec'
const config = init()
const mockGasPrice = jest.fn()
const sampleEmbargo: Embargo = {
  embargoDate: BigNumber.from(
    Math.floor(new Date().setDate(new Date().getDate() + 1) / 1000)
  ), // Convert to BigNumber
  retailPrice: ethers.utils.parseEther('0.01'),
  premium: ethers.utils.parseEther('0.001'),
  timeDenom: EmbargoTime.DAYS,
  priceFunc: EmbargoPricingFunction.LINEAR
}

jest.mock('ethers', () => {
  const original = jest.requireActual('ethers')
  const originalWallet = jest.requireActual('ethers').Wallet
  const originalContract = jest.requireActual('ethers').Contract

  return {
    ...original,
    Wallet: jest.fn().mockImplementation(() => ({
      ...originalWallet,
      address: mockRootAddress,
      provider: {
        JsonRpcProvider: jest.fn(),
        getGasPrice: mockGasPrice.mockResolvedValue(mockDefaultGasPrice)
      }
    })),
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      /* code here */
    })),
    Contract: jest.fn().mockImplementation(() => ({
      ...originalContract,
      purchaseAccess: jest
        .fn()
        .mockImplementation(() => mockTransactionResponse),
      setEmbargo: jest.fn().mockImplementation(() => mockTransactionResponse),
      auth: jest.fn().mockImplementation(() => true),
      getEmbargo: jest.fn().mockImplementation(() => sampleEmbargo),
      price: jest.fn().mockImplementation(() => '1')
    }))
  }
})

describe('TimeBased License', () => {
  describe('get TimeBased license contract instance', () => {
    it('should return contract instance and wallet address', async () => {
      await getContractInstance()
      expect(Wallet).toHaveBeenCalledWith(
        config.pvtKey,
        new ethers.providers.JsonRpcProvider(config.rpcUrl)
      )

      expect(Contract).toHaveBeenCalledWith(
        getLicense(LicenseType.timebased, config.stage),
        TIMEBASED_LICENSE_ABI,
        expect.anything()
      )
    })
  })

  describe('setPurchaseAccess', () => {
    const errorObj = {
      data: 'assetId and amount is required',
      error: 'assetId and amount is required',
      type: 'UnknownError'
    }
    it('should throw error if assetId or amount is not provided', async () => {
      try {
        await setPurchaseAccess('', 1)
      } catch (error) {
        expect(error).toMatchObject(errorObj)
      }

      try {
        await setPurchaseAccess('assetId', 0)
      } catch (error) {
        expect(error).toMatchObject(errorObj)
      }
    })

    it('should return transaction receipt', async () => {
      const result = await setPurchaseAccess('assetId', 1)
      const mockReceipt = await mockTransactionResponse.wait()
      expect(result).toEqual(mockReceipt)
    })
  })

  describe('setEmbargo', () => {
    const errorObj = {
      data: 'assetId is required',
      error: 'assetId is required',
      type: 'UnknownError'
    }

    it('should throw error if assetId is not provided', async () => {
      try {
        await setEmbargo('', sampleEmbargo)
      } catch (error) {
        expect(error).toMatchObject(errorObj)
      }
    })

    it('should return transaction receipt', async () => {
      const result = await setEmbargo('assetId', sampleEmbargo)
      const mockReceipt = await mockTransactionResponse.wait()
      expect(result).toEqual(mockReceipt)
    })
  })

  describe('checkAuth', () => {
    const errorObj = {
      data: 'assetId and address are required',
      error: 'assetId and address are required',
      type: 'UnknownError'
    }
    it('should throw error if assetId or address is not provided', async () => {
      try {
        await checkAuth('', 'address')
      } catch (error) {
        expect(error).toMatchObject(errorObj)
      }
    })

    it('should return authorization status', async () => {
      const result = await checkAuth('assetId', 'address')
      expect(result).toBe(true)
    })
  })

  describe('other utility functions', () => {
    test('should be able to call getEmbargo', async () => {
      const embargo = await getEmbargo('1')
      expect(Wallet).toHaveBeenCalledWith(
        config.pvtKey,
        new ethers.providers.JsonRpcProvider(config.rpcUrl)
      )

      expect(Contract).toHaveBeenCalledWith(
        getLicense(LicenseType.timebased, config.stage),
        TIMEBASED_LICENSE_ABI,
        expect.anything()
      )

      expect(JSON.stringify(embargo)).toBe(JSON.stringify(sampleEmbargo))
    })

    test('should be able to call getAssetPrice', async () => {
      const price = await getAssetPrice('1', new Date().getTime())
      expect(Wallet).toHaveBeenCalledWith(
        config.pvtKey,
        new ethers.providers.JsonRpcProvider(config.rpcUrl)
      )

      expect(Contract).toHaveBeenCalledWith(
        getLicense(LicenseType.timebased, config.stage),
        TIMEBASED_LICENSE_ABI,
        expect.anything()
      )

      expect(price).toBe('1')
    })
  })
})
