import { container, inject, injectable } from "tsyringe"
import { PrismaClient, Prisma } from "@prisma/client"

import { ContainerKey, makeEnv } from "@/infrastructure/container"
import { CreateTeamDto } from "../dto/create_team_dto"
import string from "@/domains/shared/utils/string"
import { Encryption } from "@/domains/shared/utils/encryption/encryption"
import { BaseRepository } from "@/domains/shared/repositories/base_repository"

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
