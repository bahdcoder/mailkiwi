import { Secret } from "@poppinss/utils"

import { Encryption } from "@/shared/utils/encryption/encryption.js"
import { RsaKeyPair } from "@/shared/utils/ssl/rsa.js"

export class DkimKeyPairTool {
  constructor(private appKey: Secret<string>) {}

  generate() {
    const dkimKeyPair = new RsaKeyPair().generate()

    return {
      ...dkimKeyPair,
      encrypted: {
        privateKey: new Encryption(this.appKey).encrypt(
          dkimKeyPair.privateKey,
        ),
      },
    }
  }
}
