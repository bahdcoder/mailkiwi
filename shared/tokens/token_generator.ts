import { randomBytes } from 'crypto'

export class TokenGenerator {
  generate(length = 32) {
    return randomBytes(length).toString('hex')
  }
}
