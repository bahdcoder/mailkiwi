import { MailerRepository } from "@/domains/teams/repositories/mailer_repository.js"
import { container } from "@/utils/typi.ts"

export class DeleteMailerAction {
  constructor(
    private mailerRepository: MailerRepository = container.make(
      MailerRepository,
    ),
  ) {}

  handle = async () => {
    // Implement action logic here
  }
}
