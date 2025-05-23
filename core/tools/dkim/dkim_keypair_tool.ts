import type { Secret } from '@poppinss/utils'

import { Encryption } from '#root/core/shared/utils/encryption/encryption.js'
import { RsaKeyPair } from '#root/core/shared/utils/ssl/rsa.js'

export class DkimKeyPairTool {
  constructor(private appKey: Secret<string>) {}

  generate() {
    const dkimKeyPair = new RsaKeyPair().generate()

    return {
      ...dkimKeyPair,
      encrypted: {
        privateKey: new Encryption(this.appKey).encrypt(dkimKeyPair.privateKey),
      },
    }
  }
}
