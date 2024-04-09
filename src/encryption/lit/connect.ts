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
import { LitNodeClient } from '@lit-protocol/lit-node-client'
import { debugLogger } from '../../utils/logger'

/**
 * This module exports an object containing two functions: `init` and `getClient`.
 * These functions are used to manage a singleton instance of `LitNodeClient`.
 */
export const { init, getClient } = (() => {
  /**
   * The singleton instance of `LitNodeClient`.
   * This instance is initialized by calling the `init` function.
   */
  let litClient: LitNodeClient | null = null

  type CSP = {
    promise: Promise<unknown> | null
    resolve: ((value: unknown) => unknown) | null
    reject: ((value: unknown) => unknown) | null
  }

  const csp: CSP = {
    promise: null,
    resolve: null,
    reject: null
  }

  const initPromise: Promise<unknown> | null = new Promise(
    (resolve, reject) => {
      csp.resolve = resolve
      csp.reject = reject
    }
  )

  csp.promise = initPromise

  /**
   * Initializes the `litClient` singleton instance.
   * This function should be called before any other function in this module.
   * If `litClient` is already initialized, this function does nothing.
   *
   * @returns A promise that resolves with the `LitNodeClient` instance.
   */
  const init = async (): Promise<LitNodeClient> => {
    if (litClient) {
      return litClient
    }

    debugLogger().debug(
      `lit client settings, ${{
        alertWhenUnauthorized: false,
        litNetwork: 'cayenne',
        debug: false
      }} `
    )

    const client = new LitNodeClient({
      alertWhenUnauthorized: false,
      litNetwork: 'cayenne',
      debug: false
    })

    await client.connect()
    litClient = client
    csp.resolve && csp.resolve(litClient)

    return litClient
  }

  /**
   * Returns the `litClient` singleton instance.
   * This function should be called after `init` has been called.
   * If `litClient` is not initialized, this function throws an error.
   *
   * @returns The `LitNodeClient` instance.
   */
  const getClient = async (): Promise<LitNodeClient> => {
    await init()
    if (!litClient) throw new Error('lit client not initialized')

    return litClient
  }

  return { init, getClient }
})()
