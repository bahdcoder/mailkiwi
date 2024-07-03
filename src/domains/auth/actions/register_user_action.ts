import { container, inject, injectable } from "tsyringe"
import { ContactRepository } from "@/domains/audiences/repositories/contact_repository"
import { CreateContactDto } from "@/domains/audiences/dto/contacts/create_contact_dto"
import { CreateUserDto } from "../users/dto/create_user_dto"
import { UserRepository } from "../users/repositories/user_repository"
import { TeamRepository } from "@/domains/teams/repositories/team_repository"
import { ContainerKey } from "@/infrastructure/container"
import { PrismaClient } from "@prisma/client"

@injectable()
export class RegisterUserAction {
  constructor(
    @inject(UserRepository)
    private userRepository: UserRepository,
    @inject(TeamRepository)
    private teamRepository: TeamRepository,
  ) {}

  handle = async (payload: CreateUserDto) => {
    const database = container.resolve<PrismaClient>(ContainerKey.database)

    const { user, team } = await database.$transaction(async (tx) => {
      const user = await this.userRepository.transaction(tx).create(payload)

      const team = await this.teamRepository
        .transaction(tx)
        .create({ name: payload.name }, user.id)

      return { user, team }
    })

    return { user, team }
  }
}
