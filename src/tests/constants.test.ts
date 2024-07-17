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
  getLitNetwork,
  getLicense,
  SIGNATURE_DEADLINE,
  PROTOCOL_ERRORS
} from '../constants'
import { LicenseType } from '../types/app'

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

describe('getLicense', () => {
  it('returns the correct contract address for allowlist license on sandbox', () => {
    const result = getLicense(LicenseType.allowlist, 'sandbox')
    expect(result).toBe('0xb98068e0DA0Da5b9a50461F3B99473a3417dFf62')
  })

  it('returns the correct contract address for allowlist license on testnet', () => {
    const result = getLicense(LicenseType.allowlist, 'testnet')
    expect(result).toBe('0xAa800342cC635FC8D9c394981120CcAf65321b15')
  })

  it('returns the correct contract address for public license on sandbox', () => {
    const result = getLicense(LicenseType.public, 'sandbox')
    expect(result).toBe('0xB4D05978AfC8a03A1D8e91314186fBd3A9E513b3')
  })

  it('returns the correct contract address for public license on testnet', () => {
    const result = getLicense(LicenseType.public, 'testnet')
    expect(result).toBe('0x6Cf8374a13b48070b600be33F16370Ab3e557600')
  })

  it('returns the correct contract address for private license on sandbox', () => {
    const result = getLicense(LicenseType.private, 'sandbox')
    expect(result).toBe('0xEab65FD2aBF9b14C08187aa69bD6A74B7993eAf3')
  })

  it('returns the correct contract address for private license on testnet', () => {
    const result = getLicense(LicenseType.private, 'testnet')
    expect(result).toBe('0xd4547af11c8296Bc9B3d79Fd9a680b2163D419C')
  })

  it('returns the correct contract address for timebased license on sandbox', () => {
    const result = getLicense(LicenseType.timebased, 'sandbox')
    expect(result).toBe('0x55B03c3025901F391bb787FeFB83f23450e7c909')
  })

  it('returns the correct contract address for authorizer license on sandbox', () => {
    const result = getLicense(LicenseType.authorizer, 'sandbox')
    expect(result).toBe('0x4d18eE1343165E74fe8de53700ee62FDB0810cDb')
  })

  // Repeat the above test case for each license type and stage combination

  it('throws an error for an invalid license type', () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    expect(() => getLicense('invalid', 'sandbox')).toThrow(
      'Invalid license type, only allowed types are allowlist,public,private,timebased,authorizer'
    )
  })
})

describe('SIGNATURE_DEADLINE', () => {
  it('equals 86400', () => {
    expect(SIGNATURE_DEADLINE).toBe(86400)
  })
})

describe('PROTOCOL_ERRORS', () => {
  it('NODE_EXISTS equals 0xe63231f6', () => {
    expect(PROTOCOL_ERRORS.NODE_EXISTS).toBe('0xe63231f6')
  })
})
