import { compareSync, hashSync } from "bcrypt"
import { inject, injectable } from "tsyringe"
import { PrismaClient, User } from "@prisma/client"
import { ContainerKey } from "@/infrastructure/container"
import { CreateUserDto } from "@/domains/auth/users/dto/create_user_dto"
import { AccessToken } from "@/domains/auth/acess_tokens/utils/access_token"
import { Secret } from "@poppinss/utils"

@injectable()
export class AccessTokenRepository {
  protected tokenSecretLength = 40
  protected tokenExpiresIn = 1000 * 60
  protected opaqueAccessTokenPrefix = "oat_"

  constructor(@inject(ContainerKey.database) private database: PrismaClient) {}

  async createAccessToken(user: User) {
    const transientAccessToken = AccessToken.createTransientToken(
      user.id,
      this.tokenSecretLength,
      this.tokenExpiresIn,
    )

    const accessToken = await this.database.accessToken.create({
      data: {
        userId: user.id,
        type: "bearer",
        abilities: ["read", "write"],
        hash: transientAccessToken.hash,
        expiresAt: transientAccessToken.expiresAt,
      },
    })

    const instance = new AccessToken({
      identifier: accessToken.id,
      tokenableId: user.id,
      type: "bearer",
      prefix: this.opaqueAccessTokenPrefix,
      secret: transientAccessToken.secret,
      createdAt: accessToken.createdAt,
      lastUsedAt: accessToken.lastUsedAt,
      updatedAt: accessToken.createdAt,
      abilities: accessToken.abilities,
      hash: accessToken.hash,
      name: "token",
      expiresAt: accessToken.expiresAt,
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

    const accessToken = await this.database.accessToken.findFirst({
      where: {
        id: decodedToken.identifier,
      },
    })

    if (!accessToken) {
      return null
    }

    const accessTokenInstance = new AccessToken({
      identifier: accessToken.id,
      tokenableId: accessToken.userId!,
      type: accessToken.type,
      prefix: this.opaqueAccessTokenPrefix,
      createdAt: accessToken.createdAt,
      lastUsedAt: accessToken.lastUsedAt,
      updatedAt: accessToken.createdAt,
      expiresAt: accessToken.expiresAt,
      abilities: accessToken.abilities,
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
