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
    expect(result).toBe('0xB592953198eE37c21f39D697e3EC630aC866a2aA')
  })

  it('returns the correct contract address for sandbox', () => {
    const result = getIdentityContractAddress('sandbox')
    expect(result).toBe('0xEe586a3655EB0D017643551e9849ed828Fd7c7FA')
  })

  it('returns the correct contract address for mainnet', () => {
    const result = getIdentityContractAddress('mainnet')
    expect(result).toBe('0xEe586a3655EB0D017643551e9849ed828Fd7c7FA')
  })

  it('throws an error for an invalid stage', () => {
    expect(() => getIdentityContractAddress('invalid')).toThrow(
      /^stage can have one of the following values/
    )
  })

  it('throws an error for an empty stage', () => {
    expect(() => getIdentityContractAddress('')).toThrow(
      /^stage can have one of the following values/
    )
  })
})

describe('getGraphContractAddress', () => {
  it('returns the correct contract address for testnet', () => {
    const result = getGraphContractAddress('testnet')
    expect(result).toBe('0x2EEed35561F9C6F454d2Ed58C87904e646214f9d')
  })

  it('returns the correct contract address for sandbox', () => {
    const result = getGraphContractAddress('sandbox')
    expect(result).toBe('0xEF2E371BaFAe46a116519F18A1cfF750570E8842')
  })

  it('returns the correct contract address for mainnet', () => {
    const result = getGraphContractAddress('mainnet')
    expect(result).toBe('0x917340A034FBce4166Bffd556015D862D00021aD')
  })

  it('throws an error for an invalid stage', () => {
    expect(() => getGraphContractAddress('invalid')).toThrow(
      /^stage can have one of the following values/
    )
  })

  it('throws an error for an empty stage', () => {
    expect(() => getGraphContractAddress('')).toThrow(
      /^stage can have one of the following values/
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
      /^stage can have one of the following values/
    )
  })
})

describe('getLicense', () => {
  it('returns the correct contract address for allowlist license on sandbox', () => {
    const result = getLicense(LicenseType.allowlist, 'sandbox')
    expect(result).toBe('0x074340A85FCc5005BE0794E29e7fe1825600366B')
  })

  it('returns the correct contract address for allowlist license on testnet', () => {
    const result = getLicense(LicenseType.allowlist, 'testnet')
    expect(result).toBe('0x3fb39aEDE0f88183195c8c506DCeE227F33062d2')
  })

  it('returns the correct contract address for public license on sandbox', () => {
    const result = getLicense(LicenseType.public, 'sandbox')
    expect(result).toBe('0x96BcFc032677da04B243f53fdb972ab6EC6Bc9f4')
  })

  it('returns the correct contract address for public license on testnet', () => {
    const result = getLicense(LicenseType.public, 'testnet')
    expect(result).toBe('0xEf71Be486abace4cCB921Bb1943351cefa208D6a')
  })

  it('returns the correct contract address for private license on sandbox', () => {
    const result = getLicense(LicenseType.private, 'sandbox')
    expect(result).toBe('0x141ae63032Ad3D89AA20bCC92Ab601B77Ec1d200')
  })

  it('returns the correct contract address for private license on testnet', () => {
    const result = getLicense(LicenseType.private, 'testnet')
    expect(result).toBe('0x2B09b8f1855E7f309B32A738E45c7545A095fC3b')
  })

  it('returns the correct contract address for timebased license on sandbox', () => {
    const result = getLicense(LicenseType.timebased, 'sandbox')
    expect(result).toBe('0xFC937a068c93e5878CcD5C20f2DBaEf95d7F1Cfe')
  })

  it('returns the correct contract address for authorizer license on sandbox', () => {
    const result = getLicense(LicenseType.authorizer, 'sandbox')
    expect(result).toBe('0xF2a81936441BA4fE353633b2874195792Fb41823')
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
