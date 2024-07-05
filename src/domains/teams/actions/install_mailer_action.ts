import { Mailer, PrismaClient, Team } from "@prisma/client"
import { inject, injectable } from "tsyringe"

import { UpdateMailerDto } from "@/domains/teams/dto/mailers/update_mailer_dto"
import { MailerRepository } from "@/domains/teams/repositories/mailer_repository"
import { E_VALIDATION_FAILED } from "@/http/responses/errors"
import { ContainerKey, makeConfig } from "@/infrastructure/container"
import { AwsSdk } from "@/providers/ses/sdk"
import { E_INTERNAL_PROCESSING_ERROR } from "@/utils/errors"

@injectable()
export class InstallMailerAction {
  constructor(
    @inject(MailerRepository)
    private mailerRepository: MailerRepository,
    @inject(ContainerKey.database) private database: PrismaClient,
  ) {}

  handle = async (mailer: Mailer, team: Team) => {
    const configuration = this.mailerRepository.getDecryptedConfiguration(
      mailer.configuration,
      team.configurationKey,
    )

    if (!configuration.region) {
      throw E_VALIDATION_FAILED({
        errors: [
          {
            message: "Region is not defined for this mailer.",
            path: ["configuration.region"],
          },
        ],
      })
    }

    let installed = false

    const applicationSettings = await this.database.setting.findFirst()

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
          status: {
            set: "CREATING_IDENTITIES",
          },
          installationCompletedAt: new Date(),
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
