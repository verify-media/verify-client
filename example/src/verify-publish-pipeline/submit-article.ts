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
import {
  init,
  submitRequest,
  ContentTypes,
  MIME_TYPES
} from '@verify-media/verify-client'
import dotenv from 'dotenv'

dotenv.config()

function generateRandomString(len: number): string {
  let result = ''
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i: number = 0; i < len; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }

  return result
}

let origin = ''
if (process.env.ORG_NAME) {
  origin = process.env.ORG_NAME
} else {
  origin = 'VERIFYMEDIA'
}

init()
const publishDate = new Date().toISOString()

const dummyArticle = {
  metadata: {
    title: 'verify protocol',
    description:
      'A protocol for media companies to register content and grant usage rights to AI platforms, while also allowing end consumers to verify the origin of content.',
    uri: 'https://www.verifymedia.com/',
    origin: origin,
    datePublished: publishDate,
    dateCreated: publishDate,
    dateUpdated: publishDate,
    authority: { name: origin, contact: origin },
    id: generateRandomString(12)
  },
  contents: [
    {
      published: publishDate,
      type: ContentTypes.IMAGE,
      contentType: MIME_TYPES.JPG,
      description:
        'A protocol for media companies to register content and grant usage rights to AI platforms, while also allowing end consumers to verify the origin of content.',
      alt: 'verifymedia',
      caption: 'MODERNIZING BRAND TRUST AND CONTENT LICENSING ',
      uri: 'https://www.verifymedia.com/assets/logo.svg',
      creditedSource: 'fox',
      authority: { name: origin, contact: origin },
      id: generateRandomString(12),
      title: 'verify protocol',
      metadata: {}
    },
    {
      published: publishDate,
      type: ContentTypes.TEXT,
      body: `${generateRandomString(100)}`,
      contentType: MIME_TYPES.TEXT,
      description:
        'A protocol for media companies to register content and grant usage rights to AI platforms, while also allowing end consumers to verify the origin of content.',
      creditedSource: origin,
      authority: { name: origin, contact: origin },
      id: generateRandomString(12),
      title: 'verify protocol',
      uri: 'https://www.verifymedia.com/',
      metadata: {}
    }
  ]
}

try {
  const resp = await submitRequest(dummyArticle, origin)
  console.log(resp)
} catch (e) {
  console.log(e)
}
