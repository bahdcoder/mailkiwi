import { MailerIdentityRepository } from '@/teams/repositories/mailer_identity_repository.js'
import { container } from '@/utils/typi.js'

export class GetMailerIdentityStatusFromProviderAction {
  constructor(
    private mailerIdentityRepository: MailerIdentityRepository = container.make(
      MailerIdentityRepository,
    ),
  ) {}

  handle = async () => {
    // Implement action logic here
  }
}
