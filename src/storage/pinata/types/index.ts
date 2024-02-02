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
import { UploadRequest } from '../../ipfs/types'

export type PinataConfig = {
  pinataKey: string
  pinataSecret: string
}

export type UploadToPinataParams = {
  data: UploadRequest
  config: PinataConfig
  type: string
}

export type PinataPinResponse = {
  IpfsHash: string
  PinSize: number
  Timestamp: string
}
