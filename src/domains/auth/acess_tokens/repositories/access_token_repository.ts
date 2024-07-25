import type { Secret } from '@poppinss/utils'
import { eq } from 'drizzle-orm'

import { AccessToken } from '@/domains/auth/acess_tokens/utils/access_token.js'
import { BaseRepository } from '@/domains/shared/repositories/base_repository.js'
import { makeDatabase } from '@/infrastructure/container.js'
import type { DrizzleClient } from '@/infrastructure/database/client.js'
import { accessTokens, users } from '@/infrastructure/database/schema/schema.js'
import type { User } from '@/infrastructure/database/schema/types.js'

export class AccessTokenRepository extends BaseRepository {
  protected tokenSecretLength = 40
  protected tokenExpiresIn = 1000 * 60
  protected opaqueAccessTokenPrefix = 'oat_'

  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async createAccessToken(user: { id: string }) {
    const transientAccessToken = AccessToken.createTransientToken(
      user.id,
      this.tokenSecretLength,
      this.tokenExpiresIn,
    )

    const id = this.cuid()

    await this.database.insert(accessTokens).values({
      id,
      userId: user.id,
      type: 'bearer',
      // abilities: ["read", "write"],
      hash: transientAccessToken.hash,
      expiresAt: transientAccessToken.expiresAt,
    })

    const instance = new AccessToken({
      identifier: id,
      tokenableId: user.id,
      type: 'bearer',
      prefix: this.opaqueAccessTokenPrefix,
      secret: transientAccessToken.secret,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      updatedAt: new Date(),
      abilities: ['read', 'write'],
      hash: transientAccessToken.hash,
      name: 'token',
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

    const accessToken = await this.database.query.accessTokens.findFirst({
      where: eq(accessTokens.id, decodedToken.identifier),
    })

    if (!accessToken) {
      return null
    }

    const accessTokenInstance = new AccessToken({
      identifier: accessToken.id,
      tokenableId: accessToken.userId as string,
      type: accessToken.type,
      prefix: this.opaqueAccessTokenPrefix,
      createdAt: accessToken.createdAt,
      lastUsedAt: accessToken.lastUsedAt,
      updatedAt: accessToken.createdAt,
      expiresAt: accessToken.expiresAt,
      abilities: ['read', 'write'],
      hash: accessToken.hash,
      name: 'Authentication token.',
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
