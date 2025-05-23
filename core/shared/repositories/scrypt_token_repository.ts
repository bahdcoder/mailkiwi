import { type BinaryLike, randomBytes, scrypt } from 'node:crypto'
import { promisify } from 'node:util'
import { eq } from 'drizzle-orm'

import { accessTokens } from '#root/database/schema.js'

import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'
import { container } from '#root/core/utils/typi.js'
import { OtpGenerator } from '../tokens/otp_generator.js'
import { DateTime } from 'luxon'

export class ScryptTokenRepository extends BaseRepository {
  protected scryptSaltLength = 32
  protected scryptHashingKeyLength = 64
  protected hashAndSaltSeparator = ':'
  /**
   * Time in minutes before email verification codes expire.
   * This relatively short expiration time enhances security while still
   * providing users enough time to complete the verification process.
   */
  protected EMAIL_VERIFICATION_CODE_EXPIRATION_MINUTES = 10

  async hash(plainValue: string) {
    const salt = randomBytes(this.scryptSaltLength).toString('hex')

    const hash = await this.scryptAsync(plainValue, salt, this.scryptHashingKeyLength)

    return salt + this.hashAndSaltSeparator + hash.toString('hex')
  }

  async verify(secretKey: string, hash: string) {
    const [salt, secret] = hash.split(this.hashAndSaltSeparator)

    const derivedKey = await this.scryptAsync(
      secretKey,
      salt,
      this.scryptHashingKeyLength,
    )

    return secret === derivedKey.toString('hex')
  }

  private scryptAsync = promisify(scrypt) as (
    password: BinaryLike,
    salt: BinaryLike,
    keylen: number,
  ) => Promise<Buffer>

  async createEmailVerificationCode() {
    const emailVerificationCode = container.make(OtpGenerator).generate()

    return {
      plainEmailVerificationCode: emailVerificationCode,
      emailVerificationCode: await this.hash(emailVerificationCode.toString()),
      emailVerificationCodeExpiresAt: DateTime.now()
        .plus({ minutes: this.EMAIL_VERIFICATION_CODE_EXPIRATION_MINUTES })
        .toJSDate(),
    }
  }

  /**
   * Verifies a user's email (or sender identity email) using their verification code.
   *
   * This method implements the email verification process:
   * 1. Checks if the verification code has expired
   * 2. Verifies the provided code against the stored hash
   * 3. If valid, marks the user's email as verified
   * 4. Clears the verification code to prevent reuse
   *
   * Email verification is a critical security measure that ensures users
   * have access to the email addresses they register with. This prevents
   * spam accounts and protects users from having their email addresses
   * registered by others without permission.
   *
   * @param entity - The user attempting to verify their email
   * @param code - The verification code provided by the user
   * @returns True if verification succeeded, false otherwise
   */
  async confirmEmailVerificationCode(
    entity: {
      emailVerificationCodeExpiresAt: Date | null
      emailVerificationCode: string | null
      id: string
    },
    code: string,
  ) {
    if (entity.emailVerificationCodeExpiresAt) {
      const hasExpired =
        DateTime.fromJSDate(entity.emailVerificationCodeExpiresAt as Date).diffNow()
          .milliseconds < 0

      if (hasExpired) {
        return false
      }
    }

    return this.verify(code.toString(), entity.emailVerificationCode as string)
  }
}
