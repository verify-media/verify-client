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
  getIdentityContractAddress,
  getGraphContractAddress
} from '../constants'

describe('getIdentityContractAddress', () => {
  it('returns the correct contract address for testnet', () => {
    const result = getIdentityContractAddress('testnet')
    expect(result).toBe('0x27BA7E931906FebA79dED5d32947b12f30379135')
  })

  it('returns the correct contract address for mainnet', () => {
    const result = getIdentityContractAddress('mainnet')
    expect(result).toBe('0xe2547fe5E99a08357083cFA42C6CDC0Cf5D65215')
  })

  it('throws an error for an invalid stage', () => {
    expect(() => getIdentityContractAddress('invalid')).toThrow(
      'stage can be either testnet or mainnet'
    )
  })

  it('throws an error for an empty stage', () => {
    expect(() => getIdentityContractAddress('')).toThrow(
      'stage can be either testnet or mainnet'
    )
  })
})

describe('getGraphContractAddress', () => {
  it('returns the correct contract address for testnet', () => {
    const result = getGraphContractAddress('testnet')
    expect(result).toBe('0xEF2E371BaFAe46a116519F18A1cfF750570E8842')
  })

  it('returns the correct contract address for mainnet', () => {
    const result = getGraphContractAddress('mainnet')
    expect(result).toBe('0x41BC4B37093F156B1BAC7785e85fE5b25203f0C8')
  })

  it('throws an error for an invalid stage', () => {
    expect(() => getGraphContractAddress('invalid')).toThrow(
      'stage can be either testnet or mainnet'
    )
  })

  it('throws an error for an empty stage', () => {
    expect(() => getGraphContractAddress('')).toThrow(
      'stage can be either testnet or mainnet'
    )
  })
})
