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
//eslint-ignore jest/no-conditional-expect
/* eslint @typescript-eslint/no-var-requires: "off" */

import { getGraphContractAddress } from '../../constants'
import { getConfig, init } from '../../index'
import { clearConfig } from '../../utils/config'
import { mockEmptyEnvVars, mockEnvVars } from '../../__fixtures__/env'
import { STAGE } from '../../types/app'

describe('test config operations', () => {
  let message = ''

  beforeEach(() => {
    jest.resetModules()
    clearConfig()
  })

  test('it throws error stage is not set', () => {
    mockEmptyEnvVars()
    try {
      init({
        stage: '',
        pvtKey: '',
        rootPvtKey: '',
        rpcUrl: '',
        walletExpiryDays: 1
      })
    } catch (e) {
      expect(e instanceof Error).toBe(true)
      if (e instanceof Error) {
        message = e.message
      }
    } finally {
      expect(message).toBe(
        'stage cannot be empty, either set and env var STAGE or pass a value to this function'
      )
    }
  })

  test('it throws error stage is not set as testnet or mainnet', () => {
    mockEmptyEnvVars()
    try {
      init({
        stage: 'mynet',
        pvtKey: '',
        rootPvtKey: '',
        rpcUrl: '',
        walletExpiryDays: 1
      })
    } catch (e) {
      expect(e instanceof Error).toBe(true)
      if (e instanceof Error) {
        message = e.message
      }
    } finally {
      expect(message).toBe('stage can be either testnet or mainnet')
    }
  })

  test('it throws error rpcUrl is not set', () => {
    mockEmptyEnvVars()
    try {
      init({
        stage: STAGE.testnet,
        pvtKey: 'abc',
        rootPvtKey: 'pqr',
        rpcUrl: '',
        walletExpiryDays: 1
      })
    } catch (e) {
      expect(e instanceof Error).toBe(true)
      if (e instanceof Error) {
        message = e.message
      }
    } finally {
      expect(message).toBe(
        'rpcUrl cannot be empty, either set and env var RPC_URL or pass a value to this function'
      )
    }
  })

  test('it throws error chainId is not set', () => {
    mockEmptyEnvVars()
    try {
      init({
        stage: STAGE.testnet,
        pvtKey: 'abc',
        rootPvtKey: 'pqr',
        rpcUrl: 'xyz',
        walletExpiryDays: 1
      })
    } catch (e) {
      expect(e instanceof Error).toBe(true)
      if (e instanceof Error) {
        message = e.message
      }
    } finally {
      expect(message).toBe(
        'chainId cannot be empty, either set and env var CHAIN_ID or pass a value to this function'
      )
    }
  })

  test('it throws error chain is not set', () => {
    mockEmptyEnvVars()
    try {
      init({
        stage: STAGE.testnet,
        pvtKey: 'abc',
        rootPvtKey: 'pqr',
        rpcUrl: 'xyz',
        chainId: 123,
        walletExpiryDays: 1
      })
    } catch (e) {
      expect(e instanceof Error).toBe(true)
      if (e instanceof Error) {
        message = e.message
      }
    } finally {
      expect(message).toBe(
        'chain cannot be empty, either set and env var CHAIN or pass a value to this function'
      )
    }
  })

  test('it uses env vars if set', () => {
    mockEnvVars()
    const config = init({
      stage: '',
      pvtKey: '',
      rpcUrl: '',
      chainId: 0,
      walletExpiryDays: 1
    })
    expect(config.pvtKey).toBe(
      '0xf215562801d0abceb3eb38691d731b1ebcdc72da79dbc95aeb6914bdba8d5ff0'
    )
    expect(config.rpcUrl).toBe('pqr')
    expect(config.stage).toBe('testnet')
    expect(config.contractAddress).toBe(getGraphContractAddress(config.stage))
    expect(config.chainId).toBe(123)
    expect(config.maxGasPrice).toBe(30000000000000)
  })

  test('it gives preference to passed vars over env vars', () => {
    const config = init({
      stage: 'mainnet',
      pvtKey: 'xyz',
      rpcUrl: 'lmn',
      chainId: 234,
      maxGasPrice: 20000000000,
      walletExpiryDays: 1
    })
    expect(config.pvtKey).toBe('xyz')
    expect(config.rpcUrl).toBe('lmn')
    expect(config.stage).toBe('mainnet')
    expect(config.contractAddress).toBe(getGraphContractAddress(config.stage))
    expect(config.chainId).toBe(234)
    expect(config.maxGasPrice).toBe(20000000000)
  })

  test('it sets testnet contract address when stage is testnet', () => {
    init({
      stage: STAGE.testnet,
      pvtKey: 'abc',
      rpcUrl: 'pqr',
      chainId: 234,
      walletExpiryDays: 1
    })
    const config = getConfig()
    expect(config.contractAddress).toBe(getGraphContractAddress(config.stage))
  })

  test('it throws error if try to fetch config without running an init', async () => {
    const { getConfig } = await import('../../index')
    mockEmptyEnvVars()
    try {
      getConfig()
    } catch (e) {
      expect(e instanceof Error).toBe(true)
      if (e instanceof Error) {
        message = e.message
      }
    } finally {
      expect(message).toBe('empty values found in config')
    }
  })
})
