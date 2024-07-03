import { inject, injectable } from "tsyringe"

import { MailerRepository } from "@/domains/teams/repositories/mailer_repository"

@injectable()
export class DeleteMailerAction {
  constructor(
    @inject(MailerRepository)
    private mailerRepository: MailerRepository,
  ) {}

  handle = async () => {
    // Implement action logic here
  }
}
