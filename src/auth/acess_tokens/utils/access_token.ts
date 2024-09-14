import {
  RuntimeException,
  Secret,
  base64,
  safeEqual,
} from "@poppinss/utils"
import { createHash } from "node:crypto"

import { CRC32 } from "@/auth/acess_tokens/utils/crc32.js"

import string from "@/shared/utils/string.js"

export class AccessToken {
  static decode(
    prefix: string,
    value: string,
  ): null | { identifier: string; secret: Secret<string> } {
    if (typeof value !== "string" || !value.startsWith(`${prefix}`)) {
      return null
    }

    const token = value.replace(new RegExp(`^${prefix}`), "")

    if (!token) {
      return null
    }

    const [identifier, ...tokenValue] = token.split(".")

    if (!identifier || tokenValue.length === 0) {
      return null
    }

    const decodedIdentifier = base64.urlDecode(identifier)

    const decodedSecret = base64.urlDecode(tokenValue.join("."))
    if (!decodedIdentifier || !decodedSecret) {
      return null
    }

    return {
      identifier: decodedIdentifier,
      secret: new Secret(decodedSecret),
    }
  }

  static createTransientToken(
    userId: string | number | bigint,
    size: number,
    expiresIn?: number,
  ) {
    let expiresAt: Date | undefined
    if (expiresIn) {
      expiresAt = new Date()
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn)
    }

    return {
      userId,
      expiresAt,
      ...AccessToken.seed(size),
    }
  }

  static seed(size: number) {
    const seed = string.random(size)
    const secret = new Secret(`${seed}${new CRC32().calculate(seed)}`)
    const hash = createHash("sha256")
      .update(secret.release())
      .digest("hex")
    return { secret, hash }
  }

  identifier: string | number | bigint

  /**
   * Reference to the user id for whom the token
   * is generated.
   */
  tokenableId: string | number | bigint

  /**
   * The value is a public representation of a token. It is created
   * by combining the "identifier"."secret"
   */
  value?: Secret<string>

  /**
   * Recognizable name for the token
   */
  name: string | null

  /**
   * A unique type to identify a bucket of tokens inside the
   * storage layer.
   */
  type: string

  /**
   * Hash is computed from the seed to later verify the validity
   * of seed
   */
  hash: string

  /**
   * Date/time when the token instance was created
   */
  createdAt: Date

  /**
   * Date/time when the token was updated
   */
  updatedAt: Date

  /**
   * Timestamp at which the token was used for authentication
   */
  lastUsedAt: Date | null

  /**
   * Timestamp at which the token will expire
   */
  expiresAt: Date | null

  /**
   * An array of abilities the token can perform. The abilities
   * is an array of abritary string values
   */
  abilities: string[]

  constructor(attributes: {
    identifier: string | number | bigint
    tokenableId: string | number | bigint
    hash: string
    createdAt: Date
    updatedAt: Date
    lastUsedAt: Date | null
    expiresAt: Date | null
    name: string | null
    prefix?: string
    secret?: Secret<string>
  }) {
    this.identifier = attributes.identifier
    this.tokenableId = attributes.tokenableId
    this.name = attributes.name
    this.hash = attributes.hash
    this.createdAt = attributes.createdAt
    this.updatedAt = attributes.updatedAt
    this.expiresAt = attributes.expiresAt
    this.lastUsedAt = attributes.lastUsedAt

    /**
     * Compute value when secret is provided
     */
    if (attributes.secret) {
      if (!attributes.prefix) {
        throw new RuntimeException(
          "Cannot compute token value without the prefix",
        )
      }
      this.value = new Secret(
        `${attributes.prefix}${base64.urlEncode(String(this.identifier))}.${base64.urlEncode(
          attributes.secret.release(),
        )}`,
      )
    }
  }

  /**
   * Check if the token has been expired. Verifies
   * the "expiresAt" timestamp with the current
   * date.
   *
   * Tokens with no expiry never expire
   */
  isExpired() {
    if (!this.expiresAt) {
      return false
    }

    return this.expiresAt < new Date()
  }

  /**
   * Verifies the value of a token against the pre-defined hash
   */
  verify(secret: Secret<string>): boolean {
    const newHash = createHash("sha256")
      .update(secret.release())
      .digest("hex")
    return safeEqual(this.hash, newHash)
  }

  toJSON() {
    return {
      name: this.name,
      token: this.value ? this.value.release() : undefined,
      lastUsedAt: this.lastUsedAt,
      expiresAt: this.expiresAt,
    }
  }
}
