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
import { unregister, init } from '@verifymedia/verify-client'
import { Wallet, ethers } from 'ethers'

import dotenv from 'dotenv'

dotenv.config()

init()

export const getWalletInstance = (): Wallet => {
  const wallet = new Wallet(
    process.env.PVT_KEY || '',
    new ethers.providers.JsonRpcProvider(process.env.RPC_URL || '')
  )

  return wallet
}

console.log('unregister intermediate wallet')
const resp = await unregister()
console.log('unregistered intermediate wallet')
console.log(`transaction hash: ${resp.transactionHash}`)
