import type { Secret } from "@poppinss/utils"
import { eq } from "drizzle-orm"

import { AccessToken } from "@/auth/acess_tokens/utils/access_token.js"

import type { DrizzleClient } from "@/database/client.js"
import { accessTokens } from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class AccessTokenRepository extends BaseRepository {
  protected tokenSecretLength = 24
  protected tokenExpiresIn = 1000 * 60
  protected opaqueAccessTokenPrefix = "kbm_"

  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async createAccessToken(
    owner: { id: number },
    type: "user" | "team" = "user",
  ) {
    const transientAccessToken = AccessToken.createTransientToken(
      owner.id,
      this.tokenSecretLength,
      this.tokenExpiresIn,
    )

    const result = await this.database.insert(accessTokens).values({
      ...(type === "user" ? { userId: owner.id } : { teamId: owner.id }),
      hash: transientAccessToken.hash,
      expiresAt: transientAccessToken.expiresAt,
    })

    const id = this.primaryKey(result)

    const instance = new AccessToken({
      identifier: id,
      tokenableId: owner.id,
      prefix: this.opaqueAccessTokenPrefix,
      secret: transientAccessToken.secret,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      updatedAt: new Date(),
      hash: transientAccessToken.hash,
      name: "token",
      expiresAt: transientAccessToken.expiresAt as Date,
    })

    return instance
  }

  async verifyToken(token: Secret<string>) {
    const decodedToken = AccessToken.decode(
      this.opaqueAccessTokenPrefix,
      token.release(),
    )

    if (!decodedToken) {
      return null
    }

    const [accessToken] = await this.database
      .select()
      .from(accessTokens)
      .where(eq(accessTokens.id, decodedToken.identifier))
      .limit(1)

    if (!accessToken) {
      return null
    }

    const accessTokenInstance = new AccessToken({
      identifier: accessToken.id,
      tokenableId: accessToken.userId as number,
      prefix: this.opaqueAccessTokenPrefix,
      createdAt: accessToken.createdAt,
      lastUsedAt: accessToken.lastUsedAt,
      updatedAt: accessToken.createdAt,
      expiresAt: accessToken.expiresAt,
      hash: accessToken.hash,
      name: "Authentication token.",
    })

    if (
      !accessTokenInstance.verify(decodedToken.secret) ||
      accessTokenInstance.isExpired()
    ) {
      return null
    }

    return { accessTokenInstance, accessToken }
  }
}
