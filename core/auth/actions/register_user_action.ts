import { UserRepository } from '@/auth/users/repositories/user_repository.js'
import { DEFAULT_TEAM_NAME } from '@/database/constants.js'

import type { InsertUser } from '@/database/database_schema_types.js'

import { E_VALIDATION_FAILED } from '@/http/responses/errors.js'
import { makeDatabase } from '@/shared/container/index.js'
import { TeamRepository } from '@/teams/repositories/team_repository.js'

import { container } from '@/utils/typi.js'

export class RegisterUserAction {
  constructor(private userRepository = container.make(UserRepository)) {}

  handle = async (payload: InsertUser) => {
    const userExists = await this.userRepository.findByEmail(payload.email)

    if (!userExists) {
      const { id, emailVerificationCode, teamId } = await makeDatabase().transaction(
        async (trx) => {
          const { id, emailVerificationCode } = await this.userRepository
            .transaction(trx)
            .create(payload)

          const { id: teamId } = await container
            .make(TeamRepository)
            .transaction(trx)
            .createFirstTeam({ name: DEFAULT_TEAM_NAME }, id)

          return {
            id,
            teamId,
            emailVerificationCode,
          }
        },
      )

      return {
        user: { id },
        teamId,
        plainEmailVerificationCode: emailVerificationCode,
      }
    }

    if (userExists?.emailVerifiedAt) {
      throw E_VALIDATION_FAILED([
        {
          message:
            'A user with this email already exists. Are you trying to login instead?',
          field: 'email',
        },
      ])
    }

    const {
      emailVerificationCode,
      emailVerificationCodeExpiresAt,
      plainEmailVerificationCode,
    } = await this.userRepository.createEmailVerificationCode()

    await this.userRepository.update(userExists.id, {
      emailVerificationCode,
      emailVerificationCodeExpiresAt,
    })

    // TODO: Queue a job to send OTP to user's email. Use bullMQ for queueing system.
    // TODO: Queue a job to invite user to community chat (insert them into channels based on their interest)
    return {
      user: userExists,
      plainEmailVerificationCode,
      teamId: userExists?.teams?.[0]?.id,
    }
  }
}
