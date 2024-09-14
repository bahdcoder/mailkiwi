import Vault from "node-vault"

import { makeEnv } from "@/shared/container/index.ts"

export class VaultSecretManager {
  private vault: Vault.client
  private resourcePath: string

  constructor(private env = makeEnv()) {}

  path(path: string) {
    this.resourcePath = path

    return this
  }

  forEntity(entityId: string) {
    return this
  }

  init() {
    this.vault = Vault({
      apiVersion: "v1",
      endpoint: this.env.SECRETS_STORE_URL,
      token: this.env.SECRETS_STORE_TOKEN,
    })

    return this
  }

  write(value: string) {}
}
