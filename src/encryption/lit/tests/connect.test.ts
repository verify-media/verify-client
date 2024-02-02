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
import { getClient, init as litConnect } from '../connect'
import '@lit-protocol/lit-node-client'

describe('connect', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should be able to initialize the client', async () => {
    const client = await litConnect()
    expect(client).toBeDefined()
    expect(client.config.litNetwork).toBe('cayenne')
    expect(client.ready).toBe(true)
  })

  it('should be able to get the client once initialized', async () => {
    const client = await getClient()
    expect(client).toBeDefined()
    expect(client.config.litNetwork).toBe('cayenne')
    expect(client.ready).toBe(true)
  })
})
