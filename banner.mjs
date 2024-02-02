/* eslint-disable @typescript-eslint/explicit-function-return-type */
import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const banner = `// Copyright 2023 Blockchain Creative Labs LLC
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
// limitations under the License.`

function addBannerToFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const exists = content.search(banner)
  if (exists === -1) {
    console.log('Banner doesnot exists in file: ' + filePath)
    fs.writeFileSync(filePath, banner + '\n' + content)
  } else {
    console.log('Banner already exists in file: ' + filePath)
  }
}

function addBannerToDirectory(directoryPath) {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const dir = path.join(__dirname, directoryPath)
  console.log('Adding banner to files in directory: ' + dir)
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(directoryPath, file)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      addBannerToDirectory(filePath)
    } else if (
      filePath.endsWith('.ts') ||
      filePath.endsWith('.d.ts') ||
      filePath.endsWith('.js') ||
      filePath.endsWith('.mjs') ||
      filePath.endsWith('.cjs')
    ) {
      addBannerToFile(filePath)
    }
  })
}

addBannerToDirectory('./dist')
