import { readFileSync, writeFileSync } from 'fs'

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))
const version = packageJson.version

writeFileSync('./src/version.ts', `export const version = '${version}'\n`)
