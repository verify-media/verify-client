import { init, getChildrenNodes } from '@verify-media/verify-client'
import dotenv from 'dotenv'

dotenv.config()

init()
const input = process.argv[2]
if (!input) {
  console.error('Please provide an asset id')
  process.exit(1)
}
const children = await getChildrenNodes(input)
console.log(children)
