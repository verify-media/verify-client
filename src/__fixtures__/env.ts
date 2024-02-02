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
export function mockEmptyEnvVars(): void {
  process.env.STAGE = ''
  process.env.PVT_KEY = ''
  process.env.ROOT_PVT_KEY = ''
  process.env.RPC_URL = ''
  process.env.CHAIN_ID = ''
  process.env.CHAIN = ''
  process.env.PINATA_KEY = ''
  process.env.PINATA_SECRET = ''
}

export function mockEnvVars(): void {
  process.env.STAGE = 'testnet'
  process.env.PVT_KEY =
    '0xf215562801d0abceb3eb38691d731b1ebcdc72da79dbc95aeb6914bdba8d5ff0'
  process.env.ROOT_PVT_KEY =
    '0xbd30db433d6933b11b56b9ec69377cdf431bcf069f01e2e62513bb7e045cdd81'
  process.env.RPC_URL = 'pqr'
  process.env.CHAIN_ID = '123'
  process.env.CHAIN = 'appchain'
}
