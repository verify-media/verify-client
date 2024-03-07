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
export type EncryptionProtocols = 'lit-protocol'

export enum StorageOptions {
  PINATA = 'pinata',
  KUBO = 'kubo'
}

export type HashingAlogs = 'keccak256'

export enum LocationProtocol {
  IPFS = 'ipfs',
  HTTPS = 'https'
}

/**
 * @remarks type definition for Signature
 */
export type Signature = {
  curve: string
  signature: string
  message: string
  description: string
}

/**
 * @remarks type definition for Location in the asset node metadata structure
 */
export type Location = {
  protocol: LocationProtocol
  uri: string
}

export type AssetAccess = {
  version: string
}

/**
 * @remarks type definition for Asset Node Data
 */
export type AssetNodeData = {
  description: string
  type: string
  encrypted: boolean
  access?: Record<EncryptionProtocols, AssetAccess>
  locations: Array<Location>
  manifest: {
    uri: string
    alt?: string
    title: string
    description?: string
    caption?: string
    creditedSource: string
    signingOrg: {
      name: string
      unit: string
    }
    published: string
  }
  contentBinding: {
    algo: HashingAlogs
    hash: string
  }
  history: string[]
}

/**
 * @remarks type definition for Asset Node
 */
export type AssetNode = {
  /**
   * {@link AssetNodeData}
   */
  data: AssetNodeData
  /**
   * {@link Signature}
   */
  signature: Signature
}

export type Authority = {
  name: string
  contact: string
}

export enum MIME_TYPES {
  JPG = 'image/jpg',
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  AVIF = 'image/avif',
  BMP = 'image/bmp',
  SVG_XML = 'image/svg+xml',
  SVG = 'image/svg',
  WEBP = 'image/webp',
  TEXT = 'text/html',
  GIF = 'image/gif'
}

export enum ContentTypes {
  HTML = 'html',
  MARKDOWN = 'markdown',
  STRING = 'string',
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video'
}

type ContentMetadata = {
  type: ContentTypes
  title: string
  description: string
  uri: string
  creditedSource: string
  id: string
  authority: Authority
  contentType: MIME_TYPES // only supported mime types
  published: string
  ownership: 'owned' | 'licensed' | 'referenced'
  licensedFrom?: string
  metadata: Record<string, unknown>
}

type TextMetadata = {
  body?: string
} & ContentMetadata

type ImageMetadata = {
  alt?: string
  caption?: string
} & ContentMetadata

type VideoMetadata = {
  thumbnail?: ImageMetadata
  duration?: number
} & ContentMetadata

export type Content = TextMetadata | ImageMetadata | VideoMetadata

export type ArticleMetadata = {
  title: string
  description: string
  uri: string
  origin: string
  datePublished: string
  dateCreated: string
  dateUpdated: string
  authority: Authority
  id: string
  optionalData?: Record<string, unknown>
}

export type Article = {
  metadata: ArticleMetadata
  contents: Content[]
}
