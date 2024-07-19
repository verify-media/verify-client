import { BigNumber, utils } from 'ethers'
import { panicErrorCodeToReason } from './panic'
import { ErrorType } from './enum'
import { DecodedError } from './types'
import { Interface } from 'ethers/lib/utils'
import { debugLogger } from '../logger'
import { GRAPH_V2_ABI } from '../../graph/protocol/types'
import { IDENTITY_ABI } from '../../graph/identity/types'

const ERROR_STRING_PREFIX = '0x08c379a0'
const PANIC_CODE_PREFIX = '0x4e487b71'
interface NestedError {
  data?: string
  error?: NestedError
  message?: string
}

export type VerifyError = {
  type: string
  error: string
  data: string
}

function extractErrorDataFromErrorObject(error: unknown): string {
  let currentError: NestedError | undefined = error as NestedError
  let errorData: string | undefined
  let extractedData: NestedError | string | undefined
  while (currentError && !errorData) {
    errorData = currentError.data
    currentError = currentError.error
    if (typeof errorData === 'string') {
      extractedData = errorData
    } else {
      extractedData = errorData
    }
  }

  if (!errorData) {
    throw error
  }

  if (typeof extractedData === 'object' && extractedData.data) {
    extractedData = extractedData.data
  }

  if (!extractedData || typeof extractedData !== 'string') {
    throw error
  }

  return extractedData
}

function decodeErrorBasedOnPrefix(
  extractedData: string,
  prefix: string,
  errorType: ErrorType,
  decodeType: string,
  defaultErrorMessage: string
): DecodedError {
  const encodedReason = extractedData.slice(prefix.length)
  try {
    const decodedValue = utils.defaultAbiCoder.decode(
      [decodeType],
      `0x${encodedReason}`
    )[0]
    const reason =
      decodeType === 'uint256'
        ? panicErrorCodeToReason(decodedValue as BigNumber) ??
          defaultErrorMessage
        : decodedValue

    return {
      type: errorType,
      error: reason,
      data: extractedData
    }
  } catch (e) {
    return {
      type: ErrorType.UnknownError,
      error: defaultErrorMessage,
      data: extractedData
    }
  }
}

export const decodeEtherError = <T extends Interface>(
  sourceError: unknown,
  abiOrInterface?: T | ConstructorParameters<typeof utils.Interface>[0]
): DecodedError => {
  const error = sourceError as Error | NestedError
  if (!(error instanceof Error)) {
    return {
      type: ErrorType.UnknownError,
      error: error.message ?? 'Unexpected error',
      data: undefined
    }
  }

  let returnData
  try {
    returnData = extractErrorDataFromErrorObject(error)
  } catch (e) {
    if (error.message?.includes('user rejected transaction')) {
      return {
        type: ErrorType.UserError,
        error: 'User has rejected the transaction',
        data: returnData
      }
    }

    return {
      type: ErrorType.UnknownError,
      error: error.message ?? 'Unknown error',
      data: returnData
    }
  }

  switch (true) {
    case returnData === '0x':
      return {
        type: ErrorType.EmptyError,
        error: 'Empty error data returned',
        data: returnData
      }
    case returnData.startsWith(ERROR_STRING_PREFIX):
      return decodeErrorBasedOnPrefix(
        returnData,
        ERROR_STRING_PREFIX,
        ErrorType.RevertError,
        'string',
        'Unknown error returned'
      )
    case returnData.startsWith(PANIC_CODE_PREFIX):
      return decodeErrorBasedOnPrefix(
        returnData,
        PANIC_CODE_PREFIX,
        ErrorType.PanicError,
        'uint256',
        'Unknown panic code'
      )
    default: {
      if (!abiOrInterface) {
        return {
          type: ErrorType.CustomError,
          error: returnData.slice(0, 10),
          data: returnData
        }
      }
      const iface: Interface =
        abiOrInterface instanceof utils.Interface
          ? abiOrInterface
          : new utils.Interface(abiOrInterface)
      const customError = iface.parseError(returnData)

      return {
        type: ErrorType.CustomError,
        error: customError.name,
        args: customError.args,
        data: returnData
      }
    }
  }
}

export function withErrorHandlingGraph<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      debugLogger().error('Error in function:', error)
      const decodedError = decodeEtherError(error, GRAPH_V2_ABI)
      const _error = {
        type: decodedError.type || 'native',
        error: decodedError.error || (error as Error).cause,
        data: decodedError.data || (error as Error).message
      }
      throw _error
    }
  }
}

export function withErrorHandlingIdentity<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      debugLogger().error('Error in function:', error)
      const decodedError = decodeEtherError(error, IDENTITY_ABI)
      const _error = {
        type: decodedError.type || 'native',
        error: decodedError.error || (error as Error).cause,
        data: decodedError.data || (error as Error).message
      }
      throw _error
    }
  }
}
