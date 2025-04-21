import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { Secret } from '@poppinss/utils'

export class Encryption {
  private algorithm = 'aes-256-cbc'
  private encryptionKey: Buffer

  private ivDelimiter = ':'

  constructor(secret: Secret<string>) {
    this.encryptionKey = createHash('sha256').update(secret.release()).digest()
  }

  encrypt(text: string | Secret<string>) {
    const iv = randomBytes(16)

    const textToEncrypt = typeof text === 'string' ? text : text.release()

    const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv)

    let encrypted = cipher.update(textToEncrypt, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    return new Secret(`${iv.toString('hex')}${this.ivDelimiter}${encrypted}`)
  }

  decrypt(encryptedData: string) {
    const [ivHex, encryptedText] = encryptedData.split(this.ivDelimiter)

    if (!ivHex || !encryptedText) {
      return null
    }

    const iv = Buffer.from(ivHex, 'hex')

    const decipher = createDecipheriv(this.algorithm, this.encryptionKey, iv)

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')

    decrypted += decipher.final('utf8')

    return new Secret(decrypted)
  }
}
