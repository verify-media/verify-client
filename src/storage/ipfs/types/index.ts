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
import { AssetNode } from '../../../types/schema'

// limitations under the License.
export type IPFSConfig = {
  rpcUri: string
  creds: string
}

export type UploadRequest = {
  name: string
  body: Uint8Array | AssetNode
}

export type UploadToIPFSParams = {
  data: UploadRequest
  config: IPFSConfig
  type?: string
}

export type IPFSResponse = {
  code?: number
  name: string
  cid: string
  size: number
}
