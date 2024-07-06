import { Team } from "@prisma/client"
import { inject, injectable } from "tsyringe"

import { CreateMailerDto } from "@/domains/teams/dto/mailers/create_mailer_dto.js"
import { MailerRepository } from "@/domains/teams/repositories/mailer_repository.js"

@injectable()
export class CreateMailerAction {
  constructor(
    @inject(MailerRepository)
    private mailerRepository: MailerRepository,
  ) {}

  handle = async (payload: CreateMailerDto, team: Team) => {
    const mailer = await this.mailerRepository.create(payload, team)

    return mailer
  }
}
