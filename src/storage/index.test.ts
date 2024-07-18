import { genCid } from './index'
import { sha256 } from 'multiformats/hashes/sha2'

const mockCid = 'mocked CID'

jest.mock('multiformats/hashes/sha2', () => ({
  sha256: {
    digest: jest.fn()
  }
}))

jest.mock('multiformats/cid', () => ({
  CID: {
    create: jest.fn().mockReturnValue({ toString: () => mockCid })
  }
}))

describe('genCid', () => {
  it('should generate CID', async () => {
    const mockData = {
      name: 'test',
      body: new Uint8Array([4, 5, 6])
    }
    const result = await genCid(mockData)

    expect(sha256.digest).toHaveBeenCalledWith(mockData.body)
    expect(result).toBe(mockCid)
  })
})
