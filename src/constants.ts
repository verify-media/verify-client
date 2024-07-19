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

import { STAGE, LicenseType } from './types/app'
import { trimLowerCase } from './utils/app'

// limitations under the License.
export const getIdentityContractAddress = (stage: string): string => {
  switch (stage) {
    case 'testnet':
      return '0x27BA7E931906FebA79dED5d32947b12f30379135'
    case 'sandbox':
      return '0xdCE27c4a76bE1fF9F9C543E13FCC3591E33A0E25'
    case 'mainnet':
      return 'TBD'
    default:
      throw new Error('stage can be either sandbox, testnet or mainnet')
  }
}

export const getGraphContractAddress = (stage: string): string => {
  switch (stage) {
    case 'testnet':
      return '0xAE8c7c7e6819f425CE750CC7F7e72A13Ef3635E0'
    case 'sandbox':
      return '0xEe586a3655EB0D017643551e9849ed828Fd7c7FA'
    case 'mainnet':
      return 'TBD'
    default:
      throw new Error('stage can be either sandbox, testnet or mainnet')
  }
}

export const getLitNetwork = (stage: string): string => {
  switch (stage) {
    case 'testnet':
      return 'cayenne'
    case 'sandbox':
      return 'cayenne'
    case 'mainnet':
      return 'habanero'
    default:
      throw new Error('stage can be either sandbox, testnet or mainnet')
  }
}

/**
 * returns the contract address of the license on the specified stage of appchain
 * @param {@link LicenseType} type of license
 * @param {@link STAGE} appchain stage
 * @returns contract address of the license on the specified stage of appchain
 */
export const getLicense = (licenseType: LicenseType, stage: string): string => {
  const _stage = trimLowerCase(stage)
  switch (trimLowerCase(licenseType)) {
    case 'allowlist': {
      const allowlistLicense: Record<STAGE, string> = {
        sandbox: '0xb98068e0DA0Da5b9a50461F3B99473a3417dFf62',
        testnet: '0xAa800342cC635FC8D9c394981120CcAf65321b15',
        mainnet: ''
      }

      return allowlistLicense[_stage as STAGE]
    }
    case 'public': {
      const publicLicense: Record<STAGE, string> = {
        sandbox: '0xB4D05978AfC8a03A1D8e91314186fBd3A9E513b3',
        testnet: '0x6Cf8374a13b48070b600be33F16370Ab3e557600',
        mainnet: ''
      }

      return publicLicense[_stage as STAGE]
    }

    case 'private': {
      const privateLicense: Record<STAGE, string> = {
        sandbox: '0xEab65FD2aBF9b14C08187aa69bD6A74B7993eAf3',
        testnet: '0xd4547af11c8296Bc9B3d79Fd9a680b2163D419C',
        mainnet: ''
      }

      return privateLicense[_stage as STAGE]
    }

    case 'timebased': {
      const timebasedLicense: Record<STAGE, string> = {
        sandbox: '0x55B03c3025901F391bb787FeFB83f23450e7c909',
        testnet: '',
        mainnet: ''
      }

      return timebasedLicense[_stage as STAGE]
    }

    case 'authorizer': {
      const authorizerLicense: Record<STAGE, string> = {
        sandbox: '0x4d18eE1343165E74fe8de53700ee62FDB0810cDb',
        testnet: '',
        mainnet: ''
      }

      return authorizerLicense[_stage as STAGE]
    }

    default:
      throw new Error(
        `Invalid license type, only allowed types are ${Object.values(LicenseType)}`
      )
  }
}

// 1 day: 60 secs by 60 mins by 24 hrs deadline for the signature to be valid till transaction is mined
export const SIGNATURE_DEADLINE = 60 * 60 * 24

export const PROTOCOL_ERRORS = {
  NODE_EXISTS: '0xe63231f6'
}
