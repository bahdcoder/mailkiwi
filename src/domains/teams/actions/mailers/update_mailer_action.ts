import { inject, injectable } from "tsyringe"
import { MailerRepository } from "@/domains/teams/repositories/mailer_repository"
import { CreateMailerDto } from "@/domains/teams/dto/mailers/create_mailer_dto"
import { Mailer, Team } from "@prisma/client"
import { UpdateMailerDto } from "../../dto/mailers/update_mailer_dto"

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
