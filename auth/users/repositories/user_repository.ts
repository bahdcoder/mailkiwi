import { eq } from 'drizzle-orm'
import { DateTime } from 'luxon'

import { TeamMembershipRepository } from '@/teams/repositories/team_membership_repository.js'

import {
  Oauth2Driver,
  type Oauth2Response,
  Oauth2UserResponse,
} from '@/auth/oauth2_drivers/base_driver.js'

import type { DrizzleClient } from '@/database/client.js'
import type {
  InsertUser,
  UpdateUser,
  UserWithTeams,
} from '@/database/database_schema_types.js'
import {
  channelMemberships,
  oauth2Accounts,
  teamMemberships,
  teams,
  users,
} from '@/database/schema.js'
import { hasMany } from '@/database/utils/relationships.js'

import { makeDatabase } from '@/shared/container/index.js'
import { ScryptTokenRepository } from '@/shared/repositories/scrypt_token_repository.js'
import { OtpGenerator } from '@/shared/tokens/otp_generator.js'

import { container } from '@/utils/typi.js'

export class UserRepository extends ScryptTokenRepository {
  protected EMAIL_VERIFICATION_CODE_EXPIRATION_MINUTES = 10
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  private hasManyTeams = hasMany(this.database, {
    from: users,
    to: teams,
    primaryKey: users.id,
    foreignKey: teams.userId,
    relationName: 'teams',
  })

  private hasManyTeamMemberships = hasMany(this.database, {
    from: users,
    to: teamMemberships,
    primaryKey: users.id,
    foreignKey: teamMemberships.userId,
    relationName: 'memberships',
  })

  private hasManyChannelMemberships = hasMany(this.database, {
    from: users,
    to: channelMemberships,
    primaryKey: users.id,
    foreignKey: channelMemberships.userId,
    relationName: 'channels',
  })

  private hasManyOauth2Accounts = hasMany(this.database, {
    from: users,
    to: oauth2Accounts,
    primaryKey: users.id,
    foreignKey: oauth2Accounts.userId,
    relationName: 'accounts',
  })

  async createUserEmailVerificationCode() {
    const emailVerificationCode = container.make(OtpGenerator).generate()

    return {
      plainEmailVerificationCode: emailVerificationCode,
      emailVerificationCode: await this.hash(emailVerificationCode.toString()),
      emailVerificationCodeExpiresAt: DateTime.now()
        .plus({ minutes: this.EMAIL_VERIFICATION_CODE_EXPIRATION_MINUTES })
        .toJSDate(),
    }
  }

  async createWithOauth2Account(oauth2Response: Oauth2Response) {
    const id = this.cuid()

    const accountId = this.cuid()

    await this.database.transaction(async (trx) => {
      await trx.insert(users).values({
        id,
        email: oauth2Response.user.email as string,
        firstName: oauth2Response.user.firstName,
        lastName: oauth2Response.user.lastName,
        emailVerifiedAt: DateTime.now().toJSDate(),
        lastLoggedInAt: DateTime.now().toJSDate(),
        lastLoggedInProvider: oauth2Response.provider,
      })

      await trx.insert(oauth2Accounts).values({
        id: accountId,
        userId: id,
        provider: oauth2Response.provider,
        providerId: oauth2Response.user.providerId,
        accessToken: this.encrypt(oauth2Response.accessToken.token).release(),
      })
    })

    return { id, accountId }
  }

  async create(user: InsertUser) {
    const id = this.cuid()

    const {
      emailVerificationCode,
      emailVerificationCodeExpiresAt,
      plainEmailVerificationCode,
    } = await this.createUserEmailVerificationCode()

    await this.database
      .insert(users)
      .values({
        id,
        ...user,
        emailVerificationCode,
        emailVerificationCodeExpiresAt,
      })
      .execute()

    return { id, emailVerificationCode: plainEmailVerificationCode }
  }

  completedOnboarding(user: UserWithTeams) {
    return Boolean(user.firstName && user.lastName && user.emailVerifiedAt)
  }

  async confirmEmailVerificationCode(user: UserWithTeams, code: string) {
    if (user.emailVerificationCodeExpiresAt) {
      const hasExpired =
        DateTime.fromJSDate(user.emailVerificationCodeExpiresAt as Date).diffNow()
          .milliseconds < 0

      if (hasExpired) {
        return false
      }
    }

    const passed = await this.verify(
      code.toString(),
      user.emailVerificationCode as string,
    )

    if (passed) {
      await this.update(user.id, {
        emailVerifiedAt: new Date(),
        emailVerificationCode: null,
      })
    }

    return passed
  }

  async update(userId: string, payload: UpdateUser) {
    if (payload.password !== undefined) {
      payload.password = await this.hash(payload.password as string)
    }

    await this.database
      .update(users)
      .set({ ...payload })
      .where(eq(users.id, userId))

    return { id: userId }
  }

  async findByEmail(email: string) {
    const [user] = await this.database
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    return user
  }

  async findByOauth2AccountProviderId(id: string) {}

  async findByIdWithChannelMemberships(id: string) {
    const [user] = await this.hasManyChannelMemberships((query) =>
      query.where(eq(users.id, id)),
    )

    return user
  }

  async findById(id: string) {
    const userWithTeams = await this.hasManyTeams((query) =>
      query.where(eq(users.id, id)),
    )

    return userWithTeams[0]
  }

  async findWithTeamsAndMemberships(id: string) {
    const [memberships, user] = await Promise.all([
      container.make(TeamMembershipRepository).findAllForUser(id),
      this.findById(id),
    ])

    return { user, memberships }
  }
}
