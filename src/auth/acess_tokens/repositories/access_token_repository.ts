import { Secret } from "@poppinss/utils"
import { eq } from "drizzle-orm"
import { randomBytes } from "node:crypto"

import type { DrizzleClient } from "@/database/client.js"
import { accessTokens } from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { ScryptTokenRepository } from "@/shared/repositories/scrypt_token_repository.js"

export class AccessTokenRepository extends ScryptTokenRepository {
  protected opaqueAccessTokenPrefix = "kbt_"
  protected keyPairDelimiter = ":"
  protected bytesSize = 16 // Do not change this. As it will break all existing and generated access tokens

  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  private getRandomBytes() {
    return randomBytes(this.bytesSize).toString("hex")
  }

  async create(
    ownerId: string,
    type: "user" | "team",
    capabilities: string[],
  ) {
    const accessKey = this.getRandomBytes()
    const accessSecret = this.getRandomBytes()

    // this.opaqueAccessTokenPrefix +

    const hashedAccessSecret = await this.hash(accessSecret)

    const name = accessKey.slice(0, 8)

    const keyPairBase64 = Buffer.from(
      `${accessKey}${this.keyPairDelimiter}${accessSecret}`,
    ).toString("base64")

    const apiKey = `${this.opaqueAccessTokenPrefix}${keyPairBase64}`

    const id = this.cuid()

    await this.database.insert(accessTokens).values({
      ...(type === "user" ? { userId: ownerId } : { teamId: ownerId }),
      name,
      accessKey,
      capabilities,
      accessSecret: hashedAccessSecret,
    })

    return {
      apiKey,
      name,
      id,
    }
  }

  async check(apiKey: string) {
    const [, base64Token] = apiKey.split(`${this.opaqueAccessTokenPrefix}`)

    const decodedToken = Buffer.from(base64Token, "base64").toString()

    const [accessKey, accessSecret] = decodedToken.split(
      this.keyPairDelimiter,
    )

    const token = await this.getAccessTokenFromAccessKey(accessKey)

    if (!token) return null

    const isValid = await this.verify(accessSecret, token.accessSecret)

    if (!isValid) {
      return null
    }

    return token
  }

  async getAccessTokenFromAccessKey(accessKey: string) {
    const self = this

    await self.cache.namespace("access_tokens").clear(accessKey)

    return self.cache
      .namespace("access_tokens")
      .get(accessKey, async function () {
        const [token] = await self.database
          .select()
          .from(accessTokens)
          .where(eq(accessTokens.accessKey, accessKey))
          .limit(1)

        return token
      })
  }
}
