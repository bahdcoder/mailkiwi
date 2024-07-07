import { eq } from "drizzle-orm"
import { inject, injectable } from "tsyringe"

import { BaseRepository } from "@/domains/shared/repositories/base_repository.js"
import { Encryption } from "@/domains/shared/utils/encryption/encryption.js"
import string from "@/domains/shared/utils/string.js"
import { ContainerKey, makeEnv } from "@/infrastructure/container.js"
import { DrizzleClient } from "@/infrastructure/database/client.ts"
import { teams } from "@/infrastructure/database/schema/schema.ts"

import { CreateTeamDto } from "../dto/create_team_dto.js"

@injectable()
export class TeamRepository extends BaseRepository {
  constructor(
    @inject(ContainerKey.database) protected database: DrizzleClient,
  ) {
    super()
  }

  async create(payload: CreateTeamDto, userId: string) {
    const id = this.cuid()

    await this.database.insert(teams).values({
      ...payload,
      id,
      configurationKey: this.generateTeamConfigurationKey(),
      userId,
    })

    return { id }
  }

  async findUserDefaultTeam(userId: string) {
    return this.database.query.teams.findFirst({
      where: eq(teams.userId, userId),
      with: {
        members: true,
        mailer: {
          with: {
            identities: true,
          },
        },
      },
    })
  }

  async findById(teamId: string) {
    const team = await this.database.query.teams.findFirst({
      where: eq(teams.id, teamId),
      with: {
        members: true,
        mailer: {
          with: {
            identities: true,
          },
        },
      },
    })

    return team
  }

  generateTeamConfigurationKey() {
    return new Encryption({
      secret: makeEnv().APP_KEY,
    }).encrypt(string.random(32))
  }
}
