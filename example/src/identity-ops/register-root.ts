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
import { registerRoot, init } from '@verifymedia/client'
import dotenv from 'dotenv'

dotenv.config()

init()

let orgName = ''
if (process.env.ORG_NAME) {
  orgName = process.env.ORG_NAME
} else {
  console.log('no org name provided, using random name')
  orgName = `test-org-${new Date().toISOString}`
}

console.log('registering org name... ', orgName)
const resp = await registerRoot(orgName)
console.log('registered root wallet')
console.log(`transaction hash: ${resp.transactionHash}`)
