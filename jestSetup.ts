if (process.env.JEST_DEBUG) {
  //increase jest default timeout when debugging via test files
  jest.setTimeout(1000 * 60 * 10)
}

import fetchMock from 'jest-fetch-mock'
fetchMock.enableMocks()

jest.mock('cbor2', () => ({
  encode: jest.fn(() => Buffer.from([]))
}))
