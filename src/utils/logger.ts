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
import Pino from 'pino'
import { version } from '../version'

function enableDebug(): {
  setDebug: (debug: boolean) => void
  getDebug: () => boolean
} {
  let _debug = false
  const setDebug = (debug: boolean): void => {
    _debug = debug
  }
  const getDebug = (): boolean => _debug

  return { setDebug, getDebug }
}

export const { setDebug, getDebug } = enableDebug()

/**
 *
 * @returns
 * @hidden
 */
export const debugLogger = (): Pino.Logger =>
  Pino({
    base: {
      version: __VERSION__
    },
    level: 'debug',
    formatters: {
      level: (label: string) => {
        return { level: label.toUpperCase() }
      },
      bindings: (bindings) => {
        return {
          pid: bindings.pid,
          host: bindings.hostname,
          node_version: process.version
        }
      }
    },
    enabled: !!(getDebug() || process.env.DEBUG === '1'),
    redact: ['key', 'pvtKey', 'rootPvtKey'],
    timestamp: Pino.stdTimeFunctions.isoTime,
    msgPrefix: `@verify-media/verify-client@${version} ==> `
  })
