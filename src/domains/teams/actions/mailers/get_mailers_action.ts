import { VerificationStatus } from "@aws-sdk/client-ses"
import {
  Mailer,
  MailerIdentity,
  MailerIdentityStatus,
  Team,
} from "@prisma/client"
import { container, inject, injectable } from "tsyringe"

import { MailerConfiguration } from "@/domains/shared/types/mailer"
import { GetMailerIdentitiesAction } from "@/domains/teams/actions/get_mailer_identities_action"
import { MailerIdentityRepository } from "@/domains/teams/repositories/mailer_identity_repository"
import { MailerRepository } from "@/domains/teams/repositories/mailer_repository"
import { AwsSdk } from "@/providers/ses/sdk"

@injectable()
export class GetMailersAction {
  constructor(
    @inject(MailerIdentityRepository)
    private mailerIdentityRepository: MailerIdentityRepository,
    @inject(MailerRepository)
    private mailerRepository: MailerRepository,
  ) {}

  handle = async (team: Team) => {
    const mailers = (await this.mailerRepository.findMany({
      where: {
        teamId: team.id,
      },
      include: {
        identities: true,
      },
    })) as (Mailer & { identities: MailerIdentity[] })[]

    const updatedMailers: (Mailer & { identities: MailerIdentity[] })[] = []

    for (let mailer of mailers) {
      const getMailerIdentitiesAction = container.resolve(
        GetMailerIdentitiesAction,
      )

      const updatedIdentities = await getMailerIdentitiesAction.handle(
        mailer.identities,
        mailer,
        team,
      )

      // if any of the identities is approved, let us set this mailer as ready for sending, but also we check the sandbox quota to make sure its not in sandbox.
      const atLeastOneApproved = updatedIdentities.some(
        (identity) => identity.status === "APPROVED",
      )

      if (atLeastOneApproved) {
        mailer = (await this.mailerRepository.update(
          mailer,
          {
            status: "READY",
          },
          team,
        )) as Mailer & { identities: MailerIdentity[] }
      }

      mailer.identities = updatedIdentities

      updatedMailers.push(mailer)
    }

    return updatedMailers
  }

  async getAwsMailerIdentities(
    identities: string[],
    configuration: MailerConfiguration,
  ) {
    const { accessKey, accessSecret, region } = configuration

    const sdk = new AwsSdk(accessKey, accessSecret, region)

    return sdk.sesService().getIdentitiesAttributes(identities)
  }

  private async ensureProviderAccess(configuration: MailerConfiguration) {
    const { accessKey, accessSecret, region } = configuration

    const sdk = new AwsSdk(accessKey, accessSecret, region)

    const hasAccess = await sdk.permissionsChecker().checkAllAccess()

    return hasAccess
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
