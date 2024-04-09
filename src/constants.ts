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
export const getIdentityContractAddress = (stage: string): string => {
  switch (stage) {
    case 'testnet':
      return '0xFC937a068c93e5878CcD5C20f2DBaEf95d7F1Cfe'
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

// 1 day: 60 secs by 60 mins by 24 hrs deadline for the signature to be valid till transaction is mined
export const SIGNATURE_DEADLINE = 60 * 60 * 24
