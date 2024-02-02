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

/**
 * @hidden
 */
export type SiweMessageParams = {
  domain?: string
  chainId: number
  statement?: string
  uri?: string
  version?: string
  address: string
  origin?: string
}

/**
 * @remarks
 * type definition for lit encryption return type
 */
export type ReturnType = {
  ciphertext: string
  dataToEncryptHash: string
}

/**
 * @hidden
 */
export type AuthSig = {
  sig: string
  derivedVia: string
  signedMessage: string
  address: string
}
