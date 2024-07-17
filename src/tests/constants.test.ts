// Copyright 2023 Blockchain Creative Labs LLC
//
// Licensed under the Apache License, Version 2.0 (the "License")
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
  getIdentityContractAddress,
  getGraphContractAddress,
  getLitNetwork
} from '../constants'

describe('getIdentityContractAddress', () => {
  it('returns the correct contract address for testnet', () => {
    const result = getIdentityContractAddress('testnet')
    expect(result).toBe('0x27BA7E931906FebA79dED5d32947b12f30379135')
  })

  it('returns the correct contract address for sandbox', () => {
    const result = getIdentityContractAddress('sandbox')
    expect(result).toBe('0xdCE27c4a76bE1fF9F9C543E13FCC3591E33A0E25')
  })

  it('returns the correct contract address for mainnet', () => {
    const result = getIdentityContractAddress('mainnet')
    expect(result).toBe('TBD')
  })

  it('throws an error for an invalid stage', () => {
    expect(() => getIdentityContractAddress('invalid')).toThrow(
      'stage can be either sandbox, testnet or mainnet'
    )
  })

  it('throws an error for an empty stage', () => {
    expect(() => getIdentityContractAddress('')).toThrow(
      'stage can be either sandbox, testnet or mainnet'
    )
  })
})

describe('getGraphContractAddress', () => {
  it('returns the correct contract address for testnet', () => {
    const result = getGraphContractAddress('testnet')
    expect(result).toBe('0xAE8c7c7e6819f425CE750CC7F7e72A13Ef3635E0')
  })

  it('returns the correct contract address for sandbox', () => {
    const result = getGraphContractAddress('sandbox')
    expect(result).toBe('0xEe586a3655EB0D017643551e9849ed828Fd7c7FA')
  })

  it('returns the correct contract address for mainnet', () => {
    const result = getGraphContractAddress('mainnet')
    expect(result).toBe('TBD')
  })

  it('throws an error for an invalid stage', () => {
    expect(() => getGraphContractAddress('invalid')).toThrow(
      'stage can be either sandbox, testnet or mainnet'
    )
  })

  it('throws an error for an empty stage', () => {
    expect(() => getGraphContractAddress('')).toThrow(
      'stage can be either sandbox, testnet or mainnet'
    )
  })
})

describe('getLitNetwork', () => {
  it('returns the correct network name for testnet', () => {
    const result = getLitNetwork('testnet')
    expect(result).toBe('cayenne')
  })

  it('returns the correct network name for mainnet', () => {
    const result = getLitNetwork('mainnet')
    expect(result).toBe('habanero')
  })

  it('throws an error for an invalid stage', () => {
    expect(() => getLitNetwork('invalid')).toThrow(
      'stage can be either sandbox, testnet or mainnet'
    )
  })
})
