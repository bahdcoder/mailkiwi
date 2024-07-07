import { Prisma, PrismaClient } from "@prisma/client"
import { inject, injectable } from "tsyringe"

import { BaseRepository } from "@/domains/shared/repositories/base_repository.js"
import { Encryption } from "@/domains/shared/utils/encryption/encryption.js"
import string from "@/domains/shared/utils/string.js"
import { ContainerKey, makeEnv } from "@/infrastructure/container.js"

import { CreateTeamDto } from "../dto/create_team_dto.js"
import { DrizzleClient } from "@/infrastructure/database/client.ts"
import { teams } from "@/infrastructure/database/schema/schema.ts"
import { eq } from "drizzle-orm"
import cuid2 from "@paralleldrive/cuid2"

@injectable()
export class TeamRepository extends BaseRepository {
  constructor(
    @inject(ContainerKey.database) protected database: DrizzleClient,
  ) {
    super()
  }

  async create(payload: CreateTeamDto, userId: string) {
    const id = cuid2.createId()
    const team = await this.database.insert(teams).values({
      ...payload,
      id,
      configurationKey: this.generateTeamConfigurationKey(),
      userId,
    })

    return team
  }

  async findUserDefaultTeam(userId: string) {
    return this.database.query.teams.findFirst({
      where: eq(teams.userId, userId),
      with: {
        members: true,
        mailer: true,
      },
    })
  }

  async findById(teamId: string, args?: Prisma.TeamFindFirstArgs) {
    const team = await this.database.query.teams.findFirst({
      where: eq(teams.id, teamId),
      with: {
        members: true,
        mailer: true,
      },
      // include: {
      //   members: {
      //     select: {
      //       userId: true,
      //       role: true,
      //       status: true,
      //     },
      //   },
      //   mailer: {
      //     include: {
      //       identities: true,
      //     },
      //   },
      // },
      // ...args,
    })

    return team
  }

  generateTeamConfigurationKey() {
    return new Encryption({
      secret: makeEnv().APP_KEY,
    }).encrypt(string.random(32))
  }
}
