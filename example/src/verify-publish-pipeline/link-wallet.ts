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
import { init, signRequest } from '@verify-media/verify-client'
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
  body: string,
  signature: string
): Promise<string> => {
  const myHeaders = new Headers()
  myHeaders.append('x-signature', signature)
  myHeaders.append('x-origin', origin)
  myHeaders.append('Content-Type', 'application/json')

  const requestOptions: RequestInit = {
    method: 'POST',
    headers: myHeaders,
    body: body,
    redirect: 'follow'
  }

  const apiUrl = process.env.LINK_WALLET || ''

  const resp = await fetch(apiUrl, requestOptions)
  const data = await resp.json()
  console.log(data)

  return 'done'
}

try {
  const body = {
    message: '',
    id: 'f697f736-a04a-43e3-afeb-ba766d04cb22'
  }

  const { signature, message } = await signRequest(origin)
  body.message = message
  await fetchControlPlane(JSON.stringify(body), signature)
} catch (e) {
  console.log(e)
}
