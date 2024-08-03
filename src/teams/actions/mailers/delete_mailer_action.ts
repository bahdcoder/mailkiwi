import { MailerRepository } from "@/teams/repositories/mailer_repository.js";
import { container } from "@/utils/typi.js";

export class DeleteMailerAction {
  constructor(
    private mailerRepository: MailerRepository = container.make(
      MailerRepository,
    ),
  ) {}

  handle = async () => {
    // Implement action logic here
  };
}
