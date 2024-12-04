import { getContractInstance, setAuth, checkAuth } from '../index'
import { init } from '../../../../utils/config'
import { Contract, Wallet, ethers } from 'ethers'
import { ALLOW_LIST_ABI } from '../types'
import {
  mockDefaultGasPrice,
  mockTransactionResponse
} from '../../../../__fixtures__/data'
import { getLicense } from '../../../../constants'
import { LicenseType } from '../../../../types/app'

const mockRootAddress = '0x706Fe724eA8F05928e5Fce8fAd5584061FE586ec'
const config = init({
  stage: 'sandbox',
  rpcUrl: 'xyz',
  chainId: 1,
  chain: 'amoy'
})
const mockGasPrice = jest.fn()

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
      setState: jest.fn().mockImplementation(() => mockTransactionResponse),
      auth: jest.fn().mockImplementation(() => true)
    }))
  }
})

describe('Allow List License', () => {
  describe('get allow list license contract instance', () => {
    it('should return contract instance and wallet address', async () => {
      await getContractInstance()
      expect(Wallet).toHaveBeenCalledWith(
        config.pvtKey,
        new ethers.providers.JsonRpcProvider(config.rpcUrl)
      )

      expect(Contract).toHaveBeenCalledWith(
        getLicense(LicenseType.allowlist, config.stage),
        ALLOW_LIST_ABI,
        expect.anything()
      )
    })
  })

  describe('setAuth', () => {
    const errorObj = {
      data: 'assetId and address are required',
      error: 'assetId and address are required',
      type: 'UnknownError'
    }
    it('should throw error if assetId or address is not provided', async () => {
      try {
        await setAuth('', 'address', true)
      } catch (error) {
        expect(error).toMatchObject(errorObj)
      }

      try {
        await setAuth('assetId', '', true)
      } catch (error) {
        expect(error).toMatchObject(errorObj)
      }
    })

    it('should throw error if isAllowed is not a boolean', async () => {
      const errorObj = {
        data: 'isAllowed must be a boolean',
        error: 'isAllowed must be a boolean',
        type: 'UnknownError'
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await setAuth('assetId', 'address', 'not boolean' as any)
      } catch (error) {
        expect(error).toMatchObject(errorObj)
      }
    })

    it('should return transaction receipt', async () => {
      const result = await setAuth('assetId', 'address', true)
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
})
