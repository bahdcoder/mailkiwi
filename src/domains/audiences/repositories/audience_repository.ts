import { PrismaClient } from "@prisma/client"
import { inject, injectable } from "tsyringe"

import { ContainerKey } from "@/infrastructure/container"

import { CreateAudienceDto } from "../dto/audiences/create_audience_dto"

@injectable()
export class AudienceRepository {
  constructor(@inject(ContainerKey.database) private database: PrismaClient) {}

  async getAllAudiences() {
    const users = await this.database.user.count()

    return users
  }

  async findById(audienceId: string) {
    return this.database.audience.findFirst({
      where: {
        id: audienceId,
      },
    })
  }

  async createAudience(payload: CreateAudienceDto, teamId: string) {
    return this.database.audience.create({
      data: {
        name: payload.name,
        teamId,
      },
    })
  }

  async updateAudience(payload: CreateAudienceDto, audienceId: string) {
    return this.database.audience.update({
      where: {
        id: audienceId,
      },
      data: payload,
    })
  }
}
