import { ErrorType } from './enum'
import { utils } from 'ethers'

export type DecodedError = {
  type: ErrorType
  error: string
  data: string | undefined
  args?: utils.Result
}
