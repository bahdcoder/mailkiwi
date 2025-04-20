import { generateKeyPairSync } from 'node:crypto'
import { Secret } from '@poppinss/utils'

export class RsaKeyPair {
  public publicKey = ''
  public privateKey = new Secret('')

  public clean() {
    return {
      publicKey: this.cleanupKey(this.publicKey),
      privateKey: new Secret(this.cleanupKey(this.privateKey.release())),
    }
  }

  private cleanupKey(key: string) {
    const lines = key.split('\n')

    lines.shift() // remove start private key line
    lines.pop() // remove empty space at end of key
    lines.pop() // remove end private key line

    return lines.join('')
  }

  public generate(modulusLength = 1024) {
    const keyPair = generateKeyPairSync('rsa', {
      modulusLength,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8', // PKCS #8 format
        format: 'pem',
      },
    })

    this.privateKey = new Secret(keyPair.privateKey)
    this.publicKey = keyPair.publicKey

    return {
      privateKey: this.privateKey,
      publicKey: this.publicKey,

      cleaned: this.clean(),
    }
  }
}
