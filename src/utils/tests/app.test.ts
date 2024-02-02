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
import {
  ensureHttps,
  ensureIPFS,
  hashData,
  isObjectEmpty,
  isObjectValuesEmpty,
  race
} from '../app'

describe('isObjectEmpty', () => {
  it('should return true for an empty object', () => {
    const obj = {}
    expect(isObjectEmpty(obj)).toBe(true)
  })

  it('should return false for a non-empty object', () => {
    const obj = { key: 'value' }
    expect(isObjectEmpty(obj)).toBe(false)
  })

  it('should return false for null', () => {
    const obj = null
    expect(isObjectEmpty(obj)).toBe(true)
  })

  it('should return false for undefined', () => {
    const obj = undefined
    expect(isObjectEmpty(obj)).toBe(true)
  })

  it('should return false for a non-object value', () => {
    const obj = 'not an object'
    expect(isObjectEmpty(obj)).toBe(false)
  })
})

describe('isObjectValuesEmpty', () => {
  it('should return false for an empty object', () => {
    const obj = {}
    expect(isObjectValuesEmpty(obj)).toBe(false)
  })

  it('should return false for a non-empty object with all non-empty values', () => {
    const obj = { key1: 'value1', key2: 'value2' }
    expect(isObjectValuesEmpty(obj)).toBe(false)
  })

  it('should return true for a non-empty object with at least one empty value', () => {
    const obj = { key1: 'value1', key2: '' }
    expect(isObjectValuesEmpty(obj)).toBe(true)
  })

  it('should return true for null', () => {
    const obj = null
    expect(isObjectValuesEmpty(obj)).toBe(true)
  })

  it('should return true for undefined', () => {
    const obj = undefined
    expect(isObjectValuesEmpty(obj)).toBe(true)
  })
})

describe('ensureHttps', () => {
  it('should return the same URI if it already starts with https://', () => {
    const uri = 'https://example.com'
    expect(ensureHttps(uri)).toBe(uri)
  })

  it('should return the same URI if it already starts with http://', () => {
    const uri = 'http://example.com'
    expect(ensureHttps(uri)).toBe(uri)
  })

  it('should prepend https:// to the URI if it does not start with http:// or https://', () => {
    const uri = 'example.com'
    expect(ensureHttps(uri)).toBe('https://' + uri)
  })

  it('should return the same URI if it is empty', () => {
    const uri = ''
    expect(ensureHttps(uri)).toBe(uri)
  })
})

describe('ensureIPFS', () => {
  it('should return the same URI if it already starts with ipfs://', () => {
    const uri = 'ipfs://example.com'
    expect(ensureIPFS(uri)).toBe(uri)
  })

  it('should prepend https:// to the URI if it does not start with ipfs://', () => {
    const uri = 'example.com'
    expect(ensureIPFS(uri)).toBe('ipfs://' + uri)
  })

  it('should return the same URI if it is empty', () => {
    const uri = ''
    expect(ensureIPFS(uri)).toBe(uri)
  })
})

describe('timeout', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setTimeout(7000)
  })

  it('should resolve with the value of the first resolved promise', async () => {
    const fn = Promise.resolve('resolved')
    const callback = jest.fn()
    const result = await race(fn, callback, 1000)
    jest.runAllTimers()
    await expect(result).toBe('resolved')
    expect(callback).toHaveBeenCalled()
  })

  it('should reject with "done" if the timeout finishes first', async () => {
    const fn = new Promise((resolve) => setTimeout(resolve, 2000, 'resolved'))
    const callback = jest.fn()
    const promise = race(fn, callback, 1000)
    jest.advanceTimersByTime(1000)
    await expect(promise).rejects.toBe('done')
  })
})

describe('hashData', () => {
  it('should throw an error if no value is passed', () => {
    expect(() => hashData('')).toThrow('no value passed was passed')
  })

  it('should return a hash for a valid string', () => {
    const data = 'test data'
    const result = hashData(data)
    expect(result).toBe(
      '0x7d92c840d5f0ac4f83543201db6005d78414059c778169efa3760f67a451e7ef'
    )
  })

  it('should return a different hash for different data', () => {
    const data1 = 'test data 1'
    const data2 = 'test data 2'

    const result1 = hashData(data1)
    const result2 = hashData(data2)

    expect(result1).not.toBe(result2)
  })
})
