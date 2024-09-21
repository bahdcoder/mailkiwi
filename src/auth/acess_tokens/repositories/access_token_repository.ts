import { Secret } from "@poppinss/utils"
import { eq } from "drizzle-orm"
import { randomBytes } from "node:crypto"

import type { DrizzleClient } from "@/database/client.js"
import { accessTokens } from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { ScryptTokenRepository } from "@/shared/repositories/scrypt_token_repository.js"

export class AccessTokenRepository extends ScryptTokenRepository {
  protected opaqueAccessTokenPrefix = "kbt_"
  protected bytesSize = 16

  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async create(ownerId: string, type: "user" | "team") {
    const tokenBytes = randomBytes(this.bytesSize).toString("hex")
    const accessSecret = new Secret(
      this.opaqueAccessTokenPrefix + tokenBytes,
    )

    const accessKey = randomBytes(this.bytesSize).toString("hex")

    const hashedAccessSecret = await this.hash(accessSecret.release())

    const name = tokenBytes.slice(0, 8)

    const id = this.cuid()
    await this.database.insert(accessTokens).values({
      ...(type === "user" ? { userId: ownerId } : { teamId: ownerId }),
      accessKey,
      accessSecret: hashedAccessSecret,
      name,
    })

    return {
      accessKey,
      accessSecret,
      hashedAccessSecret,
      name,
      id,
    }
  }

  async check(accessKey: string, accessSecret: string) {
    const [token] = await this.database
      .select()
      .from(accessTokens)
      .where(eq(accessTokens.accessKey, accessKey))
      .limit(1)

    if (!token) return null

    const isValid = await this.verify(accessSecret, token.accessSecret)

    if (!isValid) {
      return null
    }

    return token
  }
}
