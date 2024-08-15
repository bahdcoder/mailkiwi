import type { MailerConfiguration } from '@/shared/types/mailer.js'
import type { CreateMailerDto } from '@/teams/dto/mailers/create_mailer_dto.js'
import { MailerRepository } from '@/teams/repositories/mailer_repository.js'
import {
  E_OPERATION_FAILED,
  E_VALIDATION_FAILED,
} from '@/http/responses/errors.js'
import type { Team } from '@/database/schema/types.js'
import { container } from '@/utils/typi.js'
import type { CreateMailerIdentityDto } from '@/teams/dto/create_mailer_identity_dto.js'
import { CheckProviderCredentials } from '@/teams/helpers/check_provider_credentials.js'
import { CreateMailerIdentityAction } from '@/teams/actions/create_mailer_identity_action.js'
import { InstallMailerAction } from '@/teams/actions/install_mailer_action.js'

export class CreateMailerAction {
  constructor(
    private mailerRepository: MailerRepository = container.make(
      MailerRepository,
    ),
  ) {}

  handle = async (payload: CreateMailerDto, team: Team) => {
    const configurationKeysAreValid = await new CheckProviderCredentials(
      payload.configuration as MailerConfiguration,
    ).execute()

    if (!configurationKeysAreValid) {
      throw E_VALIDATION_FAILED([
        {
          message: 'The provided configuration is invalid.',
          field: 'configuration',
        },
      ])
    }

    const mailer = await this.mailerRepository.create(payload, team)

    try {
      const installed = await container
        .resolve(InstallMailerAction)
        .handle(mailer, team)

      if (!installed) {
        throw new Error('Not installed.')
      }
    } catch (error: any) {
      await this.mailerRepository.delete(mailer)
      d({ error })

      throw E_OPERATION_FAILED(
        `Could not install mailer. Reason: ${error?.message}`,
      )
    }

    const mailerIdentityAction = container.resolve(CreateMailerIdentityAction)

    const mailerIdentityPayload: CreateMailerIdentityDto = {
      value: payload.configuration.domain ?? payload.configuration.email ?? '',
      type: payload.configuration.domain ? 'DOMAIN' : 'EMAIL',
    }

    try {
      await mailerIdentityAction.handle(mailerIdentityPayload, mailer, team)
    } catch (error) {
      await this.mailerRepository.delete(mailer)

      throw error
    }

    return mailer
  }
}
