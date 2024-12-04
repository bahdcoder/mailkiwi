import { randomInt } from "crypto"
import { eq } from "drizzle-orm"

import type { CreateUserDto } from "@/auth/users/dto/create_user_dto.js"

import type { DrizzleClient } from "@/database/client.js"
import {
  InsertUser,
  UpdateUser,
  UserWithTeams,
} from "@/database/database_schema_types.js"
import { channelMemberships, channels, teams, users } from "@/database/schema.js"
import { hasMany } from "@/database/utils/relationships.js"

import { makeDatabase } from "@/shared/container/index.js"
import { OtpGenerator } from "@/shared/otp/otp_generator.js"
import { ScryptTokenRepository } from "@/shared/repositories/scrypt_token_repository.js"

import { container } from "@/utils/typi.js"

export class UserRepository extends ScryptTokenRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  private hasManyTeams = hasMany(this.database, {
    from: users,
    to: teams,
    primaryKey: users.id,
    foreignKey: teams.userId,
    relationName: "teams",
  })

  private hasManyChannelMemberships = hasMany(this.database, {
    from: users,
    to: channelMemberships,
    primaryKey: users.id,
    foreignKey: channelMemberships.userId,
    relationName: "channels",
  })

  async create(user: InsertUser) {
    const id = this.cuid()

    const emailVerificationCode = container.make(OtpGenerator).generate()

    await this.database
      .insert(users)
      .values({
        id,
        ...user,
        emailVerificationCode: await this.hash(emailVerificationCode.toString()),
      })
      .execute()

    return { id }
  }

  async confirmEmailVerificationCode(user: UserWithTeams, code: number) {
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
}
