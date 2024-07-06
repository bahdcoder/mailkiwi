import { Prisma, PrismaClient } from "@prisma/client"
import { inject, injectable } from "tsyringe"

import { BaseRepository } from "@/domains/shared/repositories/base_repository.js"
import { Encryption } from "@/domains/shared/utils/encryption/encryption.js"
import string from "@/domains/shared/utils/string.js"
import { ContainerKey, makeEnv } from "@/infrastructure/container.js"

import { CreateTeamDto } from "../dto/create_team_dto.js"

@injectable()
export class TeamRepository extends BaseRepository {
  constructor(@inject(ContainerKey.database) protected database: PrismaClient) {
    super()
  }

  async create(payload: CreateTeamDto, userId: string) {
    const team = await this.database.team.create({
      data: {
        ...payload,
        configurationKey: this.generateTeamConfigurationKey(),
        userId,
      },
    })

    return team
  }

  async findUserDefaultTeam(userId: string) {
    return this.database.team.findFirst({
      where: {
        userId: userId,
      },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
            status: true,
          },
        },
        mailer: {
          include: {
            identities: true,
          },
        },
      },
    })
  }

  async findById(teamId: string, args?: Prisma.TeamFindFirstArgs) {
    const team = await this.database.team.findFirst({
      where: {
        id: teamId,
      },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
            status: true,
          },
        },
        mailer: {
          include: {
            identities: true,
          },
        },
      },
      ...args,
    })

    return team
  }

  generateTeamConfigurationKey() {
    return new Encryption({
      secret: makeEnv().APP_KEY,
    }).encrypt(string.random(32))
  }
}
