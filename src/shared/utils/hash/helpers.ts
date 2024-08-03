import { type ScryptOptions, randomBytes, scrypt } from 'node:crypto'
import { promisify } from 'node:util'

export const MAX_UINT32 = 2 ** 32 - 1
export const MAX_UINT24 = 2 ** 24 - 1

export const randomBytesAsync = promisify(randomBytes)

/**
 * Async version of scrypt.
 */
export const scryptAsync = promisify<
  string,
  Buffer,
  number,
  ScryptOptions,
  Buffer
>(scrypt)
