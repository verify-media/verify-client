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
export class _FormData {
  append = jest.fn()

  set = jest.fn()

  get = jest.fn()

  getAll = jest.fn()

  has = jest.fn()

  delete = jest.fn()

  forEach = jest.fn()

  keys = jest.fn()

  values = jest.fn()

  entries = jest.fn();

  [Symbol.iterator] = this.entries;

  readonly [Symbol.toStringTag] = 'FormData'
}

export class _Headers {
  append = jest.fn()

  delete = jest.fn()

  get = jest.fn()

  has = jest.fn()

  set = jest.fn()

  entries = jest.fn()

  forEach = jest.fn()

  keys = jest.fn()

  values = jest.fn()

  getSetCookie = jest.fn();

  [Symbol.iterator] = this.entries;

  readonly [Symbol.toStringTag] = 'Headers'
}
