import { randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { DateTime } from 'luxon'

import { UserRepository } from '#root/core/auth/users/repositories/user_repository.js'

import { passwordResets, users } from '#root/database/schema.js'

import { ScryptTokenRepository } from '#root/core/shared/repositories/scrypt_token_repository.js'
import { TokenGenerator } from '#root/core/shared/tokens/token_generator.js'

import { container } from '#root/core/utils/typi.js'

export class PasswordResetRepository extends ScryptTokenRepository {
  protected PASSWORD_RESETS_DEFAULT_EXPIRATION_TIME_IN_MINUTES = 15

  constructor(protected userRepository = container.make(UserRepository)) {
    super()
  }

  resets() {
    return this.crud(passwordResets)
  }

  async create(email: string) {
    const user = await this.userRepository.findByEmail(email)

    if (!user) {
      return null
    }

    // Delete all existing password resets for this user
    await this.resets().deleteAll(eq(passwordResets.userId, user.id))

    const id = this.cuid()

    const token = container.make(TokenGenerator).generate()

    await this.resets().create({
      id,
      userId: user.id,
      token: await this.hash(token),
      createdAt: new Date(),
      expiresAt: DateTime.now()
        .plus({
          minutes: this.PASSWORD_RESETS_DEFAULT_EXPIRATION_TIME_IN_MINUTES,
        })
        .toJSDate(),
    })

    return { id, token }
  }

  async confirm(email: string, token: string) {
    const user = await this.userRepository.findByEmail(email)

    if (!user) {
      return { valid: false, user }
    }

    const [passwordReset] = await this.resets().findAll(
      eq(passwordResets.userId, user.id),
    )

    if (!passwordReset) {
      return { valid: false, user }
    }

    const expiresAt = DateTime.fromJSDate(passwordReset.expiresAt as Date)

    const isExpired = DateTime.now().diff(expiresAt).seconds < 0

    if (isExpired) {
      return { valid: false, user }
    }

    const isValid = await this.verify(token, passwordReset.token)

    if (!isValid) {
      return { valid: false, user }
    }

    await this.resets().delete(passwordReset.id)

    return { valid: true, user }
  }
}
