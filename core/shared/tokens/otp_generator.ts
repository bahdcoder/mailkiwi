import { randomInt } from 'node:crypto'

export class OtpGenerator {
  generate() {
    return randomInt(100000, 999999)
  }
}
