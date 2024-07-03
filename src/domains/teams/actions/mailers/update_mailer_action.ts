import { Mailer, Team } from "@prisma/client"
import { inject, injectable } from "tsyringe"

import { UpdateMailerDto } from "@/domains/teams/dto/mailers/update_mailer_dto"
import { MailerRepository } from "@/domains/teams/repositories/mailer_repository"

@injectable()
export class UpdateMailerAction {
  constructor(
    @inject(MailerRepository)
    private mailerRepository: MailerRepository,
  ) {}

  handle = async (mailer: Mailer, payload: UpdateMailerDto, team: Team) => {
    const updatedMailer = await this.mailerRepository.update(
      mailer,
      payload,
      team,
    )

    return updatedMailer
  }
}
