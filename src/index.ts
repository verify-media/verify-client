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
export {
  hashData,
  hashImage,
  hash,
  signAssetNode,
  uploadToIPFS,
  uploadToPinata,
  encryptAsset,
  registerRoot,
  unRegisterRoot,
  register,
  unregister,
  publish,
  setUri,
  createNode,
  setAccessAuth,
  setReferenceAuth,
  changeParent,
  buildAssetPayload,
  addEncryptionData,
  addIPFSData,
  addSignatureData,
  buildArticleBody,
  registerOrg,
  createArticleNode,
  createLicenseNode
} from './write'

export { publishArticle } from './write/publish-templates'

export {
  fetchFromIPFS,
  decryptAsset,
  fetchFileFromPinata,
  getImageData,
  whoIs,
  registered,
  rootName,
  nameToRoot,
  getSigningWalletNonce,
  getNode,
  verifyAsset,
  getTotalSuppy,
  getNodesCreated,
  checkAuth,
  checkRefAuth,
  getTokenToNode,
  getArticleProvenance,
  getParentNode,
  getChildrenNodes,
  getAssetDetails,
  decrypt
} from './read'

export { NodeType as NODE_TYPE } from './graph/protocol/types'
export { LocationProtocol, ContentTypes, MIME_TYPES } from './types/schema'
export { init, getConfig } from './utils/config'
export { STAGE } from './types/app'
export type { Config } from './types/app'
export type {
  AssetNode,
  Signature,
  Article,
  ContentMetadata
} from './types/schema'
export type { UploadRequest } from './storage/ipfs/types'
export type {
  NodeType,
  Node,
  ContentNode,
  ContentGraphNode
} from './graph/protocol/types'

export { version } from './version'
