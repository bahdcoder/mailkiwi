import { CreateMailerDto } from "@/domains/teams/dto/mailers/create_mailer_dto.js"
import { MailerRepository } from "@/domains/teams/repositories/mailer_repository.js"
import { Team } from "@/infrastructure/database/schema/types.js"
import { container } from "@/utils/typi.js"

export class CreateMailerAction {
  constructor(
    private mailerRepository: MailerRepository = container.make(
      MailerRepository,
    ),
  ) {}

  handle = async (payload: CreateMailerDto, team: Team) => {
    const mailer = await this.mailerRepository.create(payload, team)

    return mailer
  }
}
