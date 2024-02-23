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
import { ethers } from 'ethers'
import { debugLogger } from './logger'
import { AssetNodeData } from '../types/schema'
import Joi from 'joi'

/**
 * Checks if an object is empty.
 *
 * @param obj - The object to check.
 * @returns boolean Returns true if the object is empty or null/undefined, false otherwise.
 *
 * @hidden
 * @example
 * const isEmpty = isObjectEmpty({})
 */
export function isObjectEmpty<T>(obj: T): boolean {
  if (!obj) return true

  return !!(Object.keys(obj).length === 0 && obj.constructor === Object)
}

/**
 * Checks if any value in an object is empty.
 *
 * @param obj - The object to check.
 * @returns boolean Returns true if any value in the object is empty or null/undefined, false otherwise.
 *
 * @hidden
 * @example
 * const isAnyValueEmpty = isObjectValuesEmpty({ key: '' })
 */
export function isObjectValuesEmpty<T>(obj: T): boolean {
  if (!obj) return true

  return !!Object.values(obj).some((value) => !value)
}

/**
 *
 * @param uri
 * @returns
 * @hidden
 */
export function ensureHttps(uri: string): string {
  if (!uri) return uri
  if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
    return 'https://' + uri
  }

  return uri
}

/**
 *
 * @param uri
 * @returns
 * @hidden
 */
export function ensureIPFS(uri: string): string {
  if (!uri) return uri
  if (!uri.startsWith('ipfs://')) {
    return 'ipfs://' + uri
  }

  return uri
}

/**
 *
 * @param callback
 * @param timeout
 * @returns
 * @hidden
 */
const timeout = <T>(callback?: () => void, timeout = 5000): Promise<T> =>
  new Promise((_, reject) => {
    setTimeout(() => {
      callback && callback()
      reject('done')
    }, timeout)
  })

/**
 *
 * @param fn
 * @param callback
 * @param _timeout
 * @returns
 * @hidden
 */
export const race = <T>(
  fn: T,
  callback?: () => void,
  _timeout = 5000
): Promise<T> => {
  return Promise.race<T>([fn, timeout<T>(callback, _timeout)])
}

/**
 * Generates a keccak256 hash of the given data.
 *
 * @param data - of type Uint8Array
 * @returns string The keccak256 hash of the data.
 * @hidden
 */
export const hash = (data: Uint8Array): string => ethers.utils.keccak256(data)

/**
 * Generates a keccak256 hash of the given string data.
 *
 * @param {string} data - The string data to hash.
 * @throws {Error} If no value was passed.
 * @returns {string} The keccak256 hash of the data.
 * @hidden
 */
export function hashData(data: string): string {
  debugLogger().debug(`data passed ${!!data}`)
  if (!data) {
    throw new Error('no value passed was passed')
  }
  const dataHash = hash(new Uint8Array(Buffer.from(data, 'utf-8')))
  debugLogger().debug(`hash generated`)

  return dataHash
}

export function isValidAssetNode(asset: AssetNodeData): {
  error: Joi.ValidationError | undefined
  value: AssetNodeData
} {
  const AssetNodeDataSchema = Joi.object({
    description: Joi.string().required(),
    type: Joi.string().required(),
    encrypted: Joi.boolean().required(),
    access: Joi.object().pattern(Joi.string(), Joi.object()).optional(),
    locations: Joi.array()
      .items(
        Joi.object({
          uri: Joi.string()
            .pattern(/^(https:\/\/|ipfs:\/\/)/)
            .required(),
          protocol: Joi.string().valid('https', 'ipfs').required()
        })
      )
      .required()
      .min(1),
    manifest: Joi.object({
      uri: Joi.string()
        .uri()
        .pattern(/^https:\/\//)
        .required(),
      alt: Joi.string().allow('').optional(),
      caption: Joi.string().allow('').optional(),
      title: Joi.string().required(),
      description: Joi.string().optional(),
      creditedSource: Joi.string().required(),
      signingOrg: Joi.object({
        name: Joi.string().required(),
        unit: Joi.string().required()
      }).required(),
      published: Joi.string().isoDate().required()
    }).required(),
    contentBinding: Joi.object({
      algo: Joi.string().valid('keccak256').required(),
      hash: Joi.string().required()
    }).required(),
    history: Joi.array().items(Joi.string()).optional()
  })

  return AssetNodeDataSchema.validate(asset)
}

export const trimLowerCase = (str = ''): string =>
  str && str.replace(/\s/g, '').toLowerCase()
