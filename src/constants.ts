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
      return '0xB592953198eE37c21f39D697e3EC630aC866a2aA' //amoy
    case 'sandbox':
      return '0xEe586a3655EB0D017643551e9849ed828Fd7c7FA' //amoy
    case 'mainnet':
      return 'TBD'
    default:
      throw new Error(
        `stage can have one of the following values ${Object.values(STAGE).join(',')}`
      )
  }
}

export const getGraphContractAddress = (stage: string): string => {
  switch (stage) {
    case 'testnet':
      return '0x2EEed35561F9C6F454d2Ed58C87904e646214f9d' //amoy
    case 'sandbox':
      return '0xEF2E371BaFAe46a116519F18A1cfF750570E8842' //amoy
    case 'mainnet':
      return 'TBD'
    default:
      throw new Error(
        `stage can have one of the following values ${Object.values(STAGE).join(',')}`
      )
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
      throw new Error(
        `stage can have one of the following values ${Object.values(STAGE).join(',')}`
      )
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
        sandbox: '0x074340A85FCc5005BE0794E29e7fe1825600366B', // amoy
        testnet: '0x3fb39aEDE0f88183195c8c506DCeE227F33062d2', // amoy
        mainnet: ''
      }

      return allowlistLicense[_stage as STAGE]
    }
    case 'public': {
      const publicLicense: Record<STAGE, string> = {
        sandbox: '0x96BcFc032677da04B243f53fdb972ab6EC6Bc9f4', // amoy
        testnet: '0xEf71Be486abace4cCB921Bb1943351cefa208D6a', // amoy
        mainnet: ''
      }

      return publicLicense[_stage as STAGE]
    }

    case 'private': {
      const privateLicense: Record<STAGE, string> = {
        sandbox: '0x141ae63032Ad3D89AA20bCC92Ab601B77Ec1d200',
        testnet: '0x2B09b8f1855E7f309B32A738E45c7545A095fC3b',
        mainnet: ''
      }

      return privateLicense[_stage as STAGE]
    }

    case 'timebased': {
      const timebasedLicense: Record<STAGE, string> = {
        sandbox: '0xFC937a068c93e5878CcD5C20f2DBaEf95d7F1Cfe',
        testnet: '0x285098018b2e01a74974ABF5d34e97f655b7e227',
        mainnet: ''
      }

      return timebasedLicense[_stage as STAGE]
    }

    case 'authorizer': {
      const authorizerLicense: Record<STAGE, string> = {
        sandbox: '0xF2a81936441BA4fE353633b2874195792Fb41823',
        testnet: '0x7B4d19810Aa1AEc46ab790fB78E5F85214036bFb',
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
