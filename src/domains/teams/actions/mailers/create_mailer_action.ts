import type { CreateMailerDto } from '@/domains/teams/dto/mailers/create_mailer_dto.js'
import { MailerRepository } from '@/domains/teams/repositories/mailer_repository.js'
import type { Team } from '@/infrastructure/database/schema/types.js'
import { container } from '@/utils/typi.js'
import { CheckProviderCredentials } from '../../helpers/check_provider_credentials.ts'
import type { MailerConfiguration } from '@/domains/shared/types/mailer.ts'
import {
  E_OPERATION_FAILED,
  E_VALIDATION_FAILED,
} from '@/http/responses/errors.ts'
import { CreateMailerIdentityAction } from '../create_mailer_identity_action.ts'
import type { CreateMailerIdentityDto } from '../../dto/create_mailer_identity_dto.ts'
import { InstallMailerAction } from '../install_mailer_action.ts'
import { Queue } from '@/domains/shared/queue/queue.ts'
import { VerifyMailerIdentityJob } from '../../jobs/verify_mailer_identity_job.ts'

export class CreateMailerAction {
  constructor(
    private mailerRepository: MailerRepository = container.make(
      MailerRepository,
    ),
  ) {}

  handle = async (payload: CreateMailerDto, team: Team) => {
    const configurationKeysAreValid = await new CheckProviderCredentials(
      payload.configuration as MailerConfiguration,
      this.mailerRepository,
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
    } catch (error) {
      await this.mailerRepository.delete(mailer)

      throw E_OPERATION_FAILED(
        'Could not install mailer. There might be something wrong with your AWS credentials. Please check and try again.',
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
