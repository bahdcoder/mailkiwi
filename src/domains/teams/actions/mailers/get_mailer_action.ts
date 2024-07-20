import { MailerConfiguration } from "@/domains/shared/types/mailer.js"
import { TeamWithMembers } from "@/domains/shared/types/team.js"
import { GetMailerIdentitiesAction } from "@/domains/teams/actions/get_mailer_identities_action.js"
import { CheckProviderCredentials } from "@/domains/teams/helpers/check_provider_credentials.js"
import { MailerRepository } from "@/domains/teams/repositories/mailer_repository.js"
import { AwsSdk } from "@/providers/ses/sdk.js"
import { container } from "@/utils/typi.ts"

export class GetMailerAction {
  constructor(
    private mailerRepository: MailerRepository = container.make(
      MailerRepository,
    ),
  ) {}

  handle = async (team: TeamWithMembers) => {
    let mailer = team.mailer

    if (!mailer) return mailer

    const getMailerIdentitiesAction = container.resolve(
      GetMailerIdentitiesAction,
    )

    const configuration = this.mailerRepository.getDecryptedConfiguration(
      mailer.configuration,
      team.configurationKey,
    ) as MailerConfiguration

    const credentialsAreValid = await new CheckProviderCredentials(
      mailer,
      configuration,
      this.mailerRepository,
    ).execute(true)

    if (!credentialsAreValid) {
      return { ...mailer, status: "ACCESS_KEYS_LOST_PROVIDER_ACCESS" }
    }

    const sendingStatus = await this.getAwsSenderStatus(configuration)

    const updatedMailer = await this.mailerRepository.update(
      mailer,
      {
        sendingEnabled: sendingStatus.Enabled ?? false,
        max24HourSend: sendingStatus.Max24HourSend ?? 200,
        maxSendRate: sendingStatus.MaxSendRate ?? 1,
      },
      team,
    )

    mailer = { ...mailer, ...updatedMailer }

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
      await this.mailerRepository.update(
        mailer,
        {
          status: "READY",
        },
        team,
      )
      mailer.status = "READY"
    }

    mailer.identities = updatedIdentities

    return mailer
  }

  private async getAwsSenderStatus(configuration: MailerConfiguration) {
    const { accessKey, accessSecret, region } = configuration

    return new AwsSdk(accessKey, accessSecret, region)
      .sesService()
      .getSendingStatus()
  }
}
