import { generateKeyPairSync } from 'node:crypto'

export class RsaKeyPair {
  public publicKey = ''
  public privateKey = ''

  public clean() {
    return {
      publicKey: this.cleanupKey(this.publicKey),
      privateKey: this.cleanupKey(this.privateKey),
    }
  }

  private cleanupKey(key: string) {
    const lines = key.split('\n')

    lines.shift() // remove start private key line
    lines.pop() // remove empty space at end of key
    lines.pop() // remove end private key line

    return lines.join('')
  }

  public generate() {
    const keyPair = generateKeyPairSync('rsa', {
      modulusLength: 1024, // 1024-bit RSA encryption
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8', // PKCS #8 format
        format: 'pem',
      },
    })

    this.privateKey = keyPair.privateKey
    this.publicKey = keyPair.publicKey

    return this
  }
}
