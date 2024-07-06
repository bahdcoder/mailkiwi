import { inject, injectable } from "tsyringe"

import { MailerIdentityRepository } from "@/domains/teams/repositories/mailer_identity_repository.js"

@injectable()
export class GetMailerIdentityStatusFromProviderAction {
  constructor(
    @inject(MailerIdentityRepository)
    private mailerIdentityRepository: MailerIdentityRepository,
  ) {}

  handle = async () => {
    // Implement action logic here
  }
}
