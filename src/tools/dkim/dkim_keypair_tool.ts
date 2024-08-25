import { makeEnv } from "@/shared/container/index.ts"
import { Encryption } from "@/shared/utils/encryption/encryption.ts"
import { RsaKeyPair } from "@/shared/utils/ssl/rsa.ts"

export class DkimKeyPairTool {
  constructor(private env = makeEnv()) {}

  generate() {
    const dkimKeyPair = new RsaKeyPair().generate()

    return {
      ...dkimKeyPair,
      encrypted: {
        privateKey: new Encryption(this.env.APP_KEY).encrypt(
          dkimKeyPair.privateKey,
        ),
      },
    }
  }
}
