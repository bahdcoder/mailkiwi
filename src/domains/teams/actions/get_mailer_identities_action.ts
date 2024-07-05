import { VerificationStatus } from "@aws-sdk/client-ses"
import {
  Mailer,
  MailerIdentity,
  MailerIdentityStatus,
  Prisma,
  Team,
} from "@prisma/client"
import { inject, injectable } from "tsyringe"

import { MailerConfiguration } from "@/domains/shared/types/mailer"
import { MailerIdentityRepository } from "@/domains/teams/repositories/mailer_identity_repository"
import { AwsSdk } from "@/providers/ses/sdk"

import { MailerRepository } from "../repositories/mailer_repository"

@injectable()
export class GetMailerIdentitiesAction {
  constructor(
    @inject(MailerIdentityRepository)
    private mailerIdentityRepository: MailerIdentityRepository,
    @inject(MailerRepository)
    private mailerRepository: MailerRepository,
  ) {}

  handle = async (identities: MailerIdentity[], mailer: Mailer, team: Team) => {
    const configuration = this.mailerRepository.getDecryptedConfiguration(
      mailer.configuration,
      team.configurationKey,
    ) as MailerConfiguration

    if (mailer.provider === "AWS_SES") {
      const attributes = await this.getAwsMailerIdentities(
        identities.map((identity) => identity.value),
        configuration,
      )

      console.dir(attributes, { depth: null })

      if (!attributes) {
        return identities
      }

      const updatedIdentities: MailerIdentity[] = []

      for (let identity of identities) {
        const attribute = attributes[identity.value]

        identity = await this.mailerIdentityRepository.update(identity, {
          status: this.parseDkimStatusToDatabaseStatus(
            identity.type === "EMAIL"
              ? attribute.VerificationStatus ?? "Pending"
              : attribute.DkimVerificationStatus ?? "Pending",
          ),
          configuration: {
            ...(identity.configuration as Prisma.JsonObject),
            VerificationToken: attribute.VerificationToken,
            dkimTokens: attribute.DkimTokens,
            MailFromDomainStatus: attribute.MailFromDomainStatus,
            MailFromDomain: attribute.MailFromDomain,
            BehaviorOnMXFailure: attribute.BehaviorOnMXFailure,
          },
        })

        updatedIdentities.push(identity)
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
  ): MailerIdentityStatus {
    switch (dkimVerificationStatus) {
      case "Success":
        return "APPROVED"
      case "Failed":
        return "FAILED"
      case "Pending":
      case "NotStarted":
        return "PENDING"
      case "TemporaryFailure":
        return "TEMPORARILY_FAILED"
      default:
        return "PENDING"
    }
  }
}
