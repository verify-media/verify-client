import { getContractInstance, setAuth, checkAuth } from '../index'
import { init } from '../../../../utils/config'
import { Contract, Wallet, ethers } from 'ethers'
import { AUTHORIZER_ABI } from '../types'
import {
  mockDefaultGasPrice,
  mockTransactionResponse
} from '../../../../__fixtures__/data'
import { getLicense } from '../../../../constants'
import { LicenseType } from '../../../../types/app'

const mockRootAddress = '0x706Fe724eA8F05928e5Fce8fAd5584061FE586ec'
const config = init()
const mockGasPrice = jest.fn()

const authorizerLicenses = [
  '0xB4D05978AfC8a03A1D8e91314186fBd3A9E513b3',
  '0x55B03c3025901F391bb787FeFB83f23450e7c909'
]

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
      setAuth: jest.fn().mockImplementation(() => mockTransactionResponse),
      auth: jest.fn().mockImplementation(() => true)
    }))
  }
})

describe('Authorizer License', () => {
  describe('get Authorizer license contract instance', () => {
    it('should return contract instance and wallet address', async () => {
      await getContractInstance()
      expect(Wallet).toHaveBeenCalledWith(
        config.pvtKey,
        new ethers.providers.JsonRpcProvider(config.rpcUrl)
      )

      expect(Contract).toHaveBeenCalledWith(
        getLicense(LicenseType.authorizer, config.stage),
        AUTHORIZER_ABI,
        expect.anything()
      )
    })
  })

  describe('setAuth', () => {
    const errorObj = {
      data: 'assetId, evalExpression and authContracts  are required',
      error: 'assetId, evalExpression and authContracts  are required',
      type: 'UnknownError'
    }
    it('should throw error if assetId or address is not provided', async () => {
      try {
        await setAuth('', 'address', authorizerLicenses)
      } catch (error) {
        expect(error).toMatchObject(errorObj)
      }

      try {
        await setAuth('assetId', '', authorizerLicenses)
      } catch (error) {
        expect(error).toMatchObject(errorObj)
      }
    })

    it('should return transaction receipt', async () => {
      const result = await setAuth('assetId', 'address', authorizerLicenses)
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
