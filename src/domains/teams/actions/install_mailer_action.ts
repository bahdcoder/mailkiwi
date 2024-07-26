import type { UpdateMailerDto } from '@/domains/teams/dto/mailers/update_mailer_dto.js'
import { MailerRepository } from '@/domains/teams/repositories/mailer_repository.js'
import {
  E_OPERATION_FAILED,
  E_VALIDATION_FAILED,
} from '@/http/responses/errors.js'
import {
  makeConfig,
  makeDatabase,
  makeEnv,
} from '@/infrastructure/container.js'
import type { DrizzleClient } from '@/infrastructure/database/client.js'
import type { Mailer, Team } from '@/infrastructure/database/schema/types.js'
import { AwsSdk } from '@/providers/ses/sdk.js'
import { container } from '@/utils/typi.js'

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
          message: 'Region is not defined for this mailer.',
          field: 'configuration.region',
        },
      ])
    }

    let installed = false

    switch (mailer.provider) {
      case 'AWS_SES':
        installed = await this.installSes(
          configuration,
          mailer,
          `${makeEnv().APP_URL}/webhooks/ses`,
        )
        break
      default:
        installed = false
    }

    if (installed) {
      await this.mailerRepository.update(
        mailer,
        {
          status: 'CREATING_IDENTITIES',
          installationCompletedAt: new Date(),
        },
        team,
      )
    }

    return installed
  }

  private async installSes(
    configuration: UpdateMailerDto['configuration'],
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
