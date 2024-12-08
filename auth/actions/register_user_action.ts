import { ChannelRepository } from "@/chat/repositories/channel_repository.js"

import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import { InsertUser } from "@/database/database_schema_types.js"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"

import { container } from "@/utils/typi.js"

export class RegisterUserAction {
  constructor(
    private userRepository = container.make(UserRepository),
    private channelRepository = container.make(ChannelRepository),
  ) {}

  handle = async (payload: InsertUser) => {
    const channels = await this.channelRepository.channels().findAll()

    const userExists = await this.userRepository.findByEmail(payload.email)

    if (!userExists) {
      const user = await this.userRepository.create({ ...payload })

      // TODO: Queue a job to send OTP to user's email. Use Trigger.dev for queueing system.
      // TODO: Queue a job to invite user to community chat (insert them into channels based on their interest)

      return { user }
    }

    if (userExists && userExists.emailVerifiedAt) {
      throw E_VALIDATION_FAILED([
        {
          message:
            "A user with this email already exists. Are you trying to login instead?",
          field: "email",
        },
      ])
    }

    if (userExists) {
      const {
        emailVerificationCode,
        emailVerificationCodeExpiresAt,
        plainEmailVerificationCode,
      } = await this.userRepository.createUserEmailVerificationCode()

      await this.userRepository.update(userExists.id, {
        emailVerificationCode,
        emailVerificationCodeExpiresAt,
      })

      // TODO: Queue a job to send OTP to user's email. Use Trigger.dev for queueing system.
      //
      return { user: userExists, plainEmailVerificationCode }
    }

    const user = await this.userRepository.create({ ...payload })

    // TODO: Queue a job to send OTP to user's email. Use Trigger.dev for queueing system.
    // TODO: Queue a job to invite user to community chat (insert them into channels based on their interest)

    return { user }
  }
}
