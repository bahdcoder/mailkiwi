import { BinaryLike, randomBytes, scrypt } from "crypto"
import { eq } from "drizzle-orm"
import { promisify } from "util"

import { accessTokens } from "@/database/schema/schema.js"

import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class ScryptTokenRepository extends BaseRepository {
  protected scryptSaltLength = 32
  protected scryptHashingKeyLength = 64
  protected hashAndSaltSeparator = ":"

  async hash(secretKey: string) {
    const salt = randomBytes(this.scryptSaltLength).toString("hex")

    const hash = await this.scryptAsync(
      secretKey,
      salt,
      this.scryptHashingKeyLength,
    )

    return salt + this.hashAndSaltSeparator + hash.toString("hex")
  }

  async verify(secretKey: string, hash: string) {
    const [salt, secret] = hash.split(this.hashAndSaltSeparator)

    const derivedKey = await this.scryptAsync(
      secretKey,
      salt,
      this.scryptHashingKeyLength,
    )

    return secret === derivedKey.toString("hex")
  }

  private scryptAsync = promisify(scrypt) as (
    password: BinaryLike,
    salt: BinaryLike,
    keylen: number,
  ) => Promise<Buffer>
}
