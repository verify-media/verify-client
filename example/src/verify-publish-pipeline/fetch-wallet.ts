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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { init, signRequest } from '@verifymedia/verify-client'
import dotenv from 'dotenv'

dotenv.config()

let origin = ''
if (process.env.ORG_NAME) {
  origin = process.env.ORG_NAME
} else {
  origin = 'VERIFYMEDIA'
}

init()

const fetchControlPlane = async (
  signature: string,
  message: string
): Promise<string> => {
  const myHeaders = new Headers()
  myHeaders.append('x-signature', signature)
  myHeaders.append('x-origin', origin)
  myHeaders.append('Content-Type', 'application/json')

  const requestOptions: RequestInit = {
    method: 'GET',
    headers: myHeaders
  }

  const apiUrl = process.env.FETCH_WALLET_URL || ''

  const resp = await fetch(
    `${apiUrl}?message=${encodeURIComponent(message)}&type=transact`,
    requestOptions
  )
  const data = await resp.json()
  console.log(data)

  return 'done'
}

try {
  const { signature, message } = await signRequest(origin)
  await fetchControlPlane(signature, message)
} catch (e) {
  console.log(e)
}
