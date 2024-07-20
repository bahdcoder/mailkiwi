import { UpdateMailerDto } from "@/domains/teams/dto/mailers/update_mailer_dto.js"
import { MailerRepository } from "@/domains/teams/repositories/mailer_repository.js"
import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"
import { makeConfig, makeDatabase } from "@/infrastructure/container.js"
import { DrizzleClient } from "@/infrastructure/database/client.js"
import { Mailer, Team } from "@/infrastructure/database/schema/types.js"
import { AwsSdk } from "@/providers/ses/sdk.js"
import { E_INTERNAL_PROCESSING_ERROR } from "@/utils/errors.js"
import { container } from "@/utils/typi.js"

export class InstallMailerAction {
  constructor(
    private mailerRepository: MailerRepository = container.make(
      MailerRepository,
    ),
    private database: DrizzleClient = makeDatabase(),
  ) {}

  handle = async (mailer: Mailer, team: Team) => {
    const configuration = this.mailerRepository.getDecryptedConfiguration(
      mailer.configuration,
      team.configurationKey,
    )

    if (!configuration.region) {
      throw E_VALIDATION_FAILED([
        {
          message: "Region is not defined for this mailer.",
          field: "configuration.region",
        },
      ])
    }

    let installed = false

    const applicationSettings = await this.database.query.settings.findFirst()

    if (!applicationSettings || !applicationSettings.url)
      throw E_INTERNAL_PROCESSING_ERROR(
        "Application settings not properly defined. Please contact an administrator.",
      )

    switch (mailer.provider) {
      case "AWS_SES":
        installed = await this.installSes(
          configuration,
          mailer,
          `${applicationSettings.url}/webhooks/ses`,
        )
        break
      default:
        installed = false
    }

    if (installed) {
      await this.mailerRepository.update(
        mailer,
        {
          status: "CREATING_IDENTITIES",
          installationCompletedAt: Date.now(),
        },
        team,
      )
    }

    return installed
  }

  private async installSes(
    configuration: UpdateMailerDto["configuration"],
    mailer: Mailer,
    endpoint: string,
  ) {
    if (!configuration.region) {
      return false
    }

    const sdk = new AwsSdk(
      configuration.accessKey,
      configuration.accessSecret,
      configuration.region,
    )

    const configurationSetName = `${makeConfig().software.shortName}_${mailer.id}`

    try {
      await sdk.install(configurationSetName, endpoint)

      return true
    } catch (error) {
      await sdk.uninstall(configurationSetName)

      throw error
    }
  }
}
