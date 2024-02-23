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
      return '0x27BA7E931906FebA79dED5d32947b12f30379135'
    case 'mainnet':
      return '0xe2547fe5E99a08357083cFA42C6CDC0Cf5D65215'
    default:
      throw new Error('stage can be either testnet or mainnet')
  }
}

export const getGraphContractAddress = (stage: string): string => {
  switch (stage) {
    case 'testnet':
      return '0xEF2E371BaFAe46a116519F18A1cfF750570E8842'
    case 'mainnet':
      return '0x41BC4B37093F156B1BAC7785e85fE5b25203f0C8'
    default:
      throw new Error('stage can be either testnet or mainnet')
  }
}

// 1 day: 60 secs by 60 mins by 24 hrs deadline for the signature to be valid till transaction is mined
export const SIGNATURE_DEADLINE = 60 * 60 * 24
