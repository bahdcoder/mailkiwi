import type { VerificationStatus } from '@aws-sdk/client-ses'

import type { MailerConfiguration } from '@/domains/shared/types/mailer.js'
import { MailerIdentityRepository } from '@/domains/teams/repositories/mailer_identity_repository.js'
import type {
  Mailer,
  MailerIdentity,
  Team,
} from '@/infrastructure/database/schema/types.js'
import { AwsSdk } from '@/providers/ses/sdk.js'
import { container } from '@/utils/typi.js'

import { MailerRepository } from '../repositories/mailer_repository.js'

export class GetMailerIdentitiesAction {
  constructor(
    private mailerIdentityRepository: MailerIdentityRepository = container.make(
      MailerIdentityRepository,
    ),

    private mailerRepository: MailerRepository = container.make(
      MailerRepository,
    ),
  ) {}

  handle = async (identities: MailerIdentity[], mailer: Mailer, team: Team) => {
    const configuration = this.mailerRepository.getDecryptedConfiguration(
      mailer.configuration,
      team.configurationKey,
    ) as MailerConfiguration

    if (mailer.provider === 'AWS_SES') {
      const attributes = await this.getAwsMailerIdentities(
        identities.map((identity) => identity.value),
        configuration,
      )

      if (!attributes) {
        return identities
      }

      const updatedIdentities: MailerIdentity[] = []

      for (const identity of identities) {
        const attribute = attributes[identity.value]

        const updated = {
          status: this.parseDkimStatusToDatabaseStatus(
            identity.type === 'EMAIL'
              ? attribute.VerificationStatus ?? 'Pending'
              : attribute.DkimVerificationStatus ?? 'Pending',
          ),
          configuration: {
            ...(identity.configuration as object),
            VerificationToken: attribute.VerificationToken,
            dkimTokens: attribute.DkimTokens,
            MailFromDomainStatus: attribute.MailFromDomainStatus,
            MailFromDomain: attribute.MailFromDomain,
            BehaviorOnMXFailure: attribute.BehaviorOnMXFailure,
          },
        }

        await this.mailerIdentityRepository.update(identity.id, updated)

        updatedIdentities.push({ ...identity, ...updated })
      }

      return updatedIdentities
    }

    return identities
  }

  async getAwsMailerIdentities(
    identities: string[],
    configuration: MailerConfiguration,
  ) {
    const { accessKey, accessSecret, region } = configuration

    return new AwsSdk(accessKey, accessSecret, region)
      .sesService()
      .getIdentitiesAttributes(identities)
  }

  private parseDkimStatusToDatabaseStatus(
    dkimVerificationStatus: VerificationStatus,
  ): Required<MailerIdentity['status']> {
    switch (dkimVerificationStatus) {
      case 'Success':
        return 'APPROVED'
      case 'Failed':
        return 'FAILED'
      case 'Pending':
      case 'NotStarted':
        return 'PENDING'
      case 'TemporaryFailure':
        return 'TEMPORARILY_FAILED'
      default:
        return 'PENDING'
    }
  }
}
