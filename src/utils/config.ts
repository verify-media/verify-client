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
  getGraphContractAddress,
  getIdentityContractAddress
} from '../constants'
import { Config, Settings, STAGE } from '../types/app'
import { setDebug } from './logger'

export const { init, getConfig, clearConfig, unset, set } = (() => {
  let _config: Config = {
    stage: '',
    pvtKey: '',
    rpcUrl: '',
    contractAddress: '',
    identityContractAddress: '',
    chainId: 0,
    chain: '',
    maxGasPrice: 0,
    walletExpiryDays: 1,
    rootPvtKey: ''
  }
  /**
   * Initializes the configuration.
   *
   * @param config - The {@link Settings} for the configuration.
   * @remarks
   * This function initializes the configuration by setting the stage, private key, and RPC URL.
   * The stage is set to 'testnet' or 'mainnet' based on the input.
   * The private key and RPC URL are set based on the input or environment variables.
   * If the private key or RPC URL is not provided, an error is thrown.
   * @throws Error Throws an error if the private key or RPC URL is not provided.
   * @returns {@link Config} The initialized configuration.
   *
   * @example
   * const myConfig = init({ stage: 'testnet', pvtKey: 'myPrivateKey', rpcUrl: 'myRpcUrl' });
   */
  const init = (config?: Settings): Config => {
    const stage = (config?.stage || process.env.STAGE || '') as STAGE

    const stages = Object.values(STAGE)
    if (!stage) {
      throw new Error(
        'stage cannot be empty, either set and env var STAGE or pass a value to this function'
      )
    }
    if (!stages.includes(stage as unknown as STAGE)) {
      throw new Error('stage can be either sandbox, testnet or mainnet')
    }

    _config.stage = stage

    const pvtKey = config?.pvtKey || process.env.PVT_KEY || ''
    if (!_config.pvtKey) _config.pvtKey = pvtKey

    const rpcUrl = config?.rpcUrl || process.env.RPC_URL || ''
    if (!rpcUrl) {
      throw new Error(
        'rpcUrl cannot be empty, either set and env var RPC_URL or pass a value to this function'
      )
    }
    if (!_config.rpcUrl) _config.rpcUrl = rpcUrl

    const chainId = config?.chainId || process.env.CHAIN_ID || 0
    if (!chainId) {
      throw new Error(
        'chainId cannot be empty, either set and env var CHAIN_ID or pass a value to this function'
      )
    }
    //convert chainId to number
    if (!_config.chainId) _config.chainId = parseInt(chainId.toString())

    const chain = config?.chain || process.env.CHAIN || ''
    if (!chain) {
      throw new Error(
        'chain cannot be empty, either set and env var CHAIN or pass a value to this function'
      )
    }
    if (!_config.chain) _config.chain = chain

    const walletExpiry =
      config?.walletExpiryDays || process.env.WALLET_EXPIRY_DAYS || 1

    if (!_config.walletExpiryDays)
      _config.walletExpiryDays = Number(walletExpiry)

    const maxGasPrice = config?.maxGasPrice || process.env.MAX_GAS_PRICE || 0
    if (!_config.maxGasPrice) _config.maxGasPrice = Number(maxGasPrice)

    const rootPvtKey = config?.rootPvtKey || process.env.ROOT_PVT_KEY || ''
    if (!_config.rootPvtKey) _config.rootPvtKey = rootPvtKey

    if (!_config.contractAddress)
      _config.contractAddress = getGraphContractAddress(stage)

    if (!_config.identityContractAddress)
      _config.identityContractAddress = getIdentityContractAddress(stage)

    setDebug(config?.debug || process.env.DEBUG === '1')

    return _config
  }

  /**
   * Gets the configuration.
   *
   * @remarks
   * This function returns the configuration object.
   * If any value in the configuration object is empty, an error is thrown.
   * @throws Error Throws an error if any value in the configuration object is empty.
   * @returns {@link Config} The configuration.
   *
   * @example
   * const myConfig = getConfig();
   */
  const getConfig = (): Config => {
    const keysToCheck = [
      'stage',
      'rpcUrl',
      'chainId',
      'chain',
      'contractAddress',
      'identityContractAddress'
    ]

    const allKeysExist = keysToCheck.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(_config, key) &&
        Boolean(_config[key as keyof typeof _config])
    )

    if (!allKeysExist) {
      throw new Error('empty values found in config')
    }

    return _config
  }

  /**
   * @hidden
   */
  const clearConfig = (): void => {
    _config = {
      stage: '',
      pvtKey: '',
      rpcUrl: '',
      contractAddress: '',
      identityContractAddress: '',
      chainId: 0,
      chain: '',
      maxGasPrice: 0,
      walletExpiryDays: 1,
      rootPvtKey: ''
    }
  }

  /**
   * @hidden
   */
  const unset = (keyName: keyof Config): void => {
    delete _config[keyName]
  }

  /**
   * @hidden
   */
  const set = (keyName: keyof Config, value: string): void => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    _config[keyName] = value
  }

  return { init, getConfig, clearConfig, unset, set }
})()
