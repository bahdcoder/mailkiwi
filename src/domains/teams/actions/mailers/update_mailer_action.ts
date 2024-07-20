import { MailerConfiguration } from "@/domains/shared/types/mailer.js"
import { CreateMailerIdentityAction } from "@/domains/teams/actions/create_mailer_identity_action.js"
import { CreateMailerIdentityDto } from "@/domains/teams/dto/create_mailer_identity_dto.js"
import { UpdateMailerDto } from "@/domains/teams/dto/mailers/update_mailer_dto.js"
import { CheckProviderCredentials } from "@/domains/teams/helpers/check_provider_credentials.js"
import { MailerRepository } from "@/domains/teams/repositories/mailer_repository.js"
import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"
import { Mailer, Team } from "@/infrastructure/database/schema/types.js"
import { container } from "@/utils/typi.js"

export class UpdateMailerAction {
  protected isReconnecting = false
  constructor(
    private mailerRepository: MailerRepository = container.make(
      MailerRepository,
    ),
  ) {}

  reconnecting() {
    this.isReconnecting = true

    return this
  }

  handle = async (mailer: Mailer, payload: UpdateMailerDto, team: Team) => {
    const configurationKeysAreValid = await new CheckProviderCredentials(
      mailer,
      payload.configuration as MailerConfiguration,
    ).execute()

    if (!configurationKeysAreValid) {
      throw E_VALIDATION_FAILED([
        {
          message: "The provided configuration is invalid.",
          field: "configuration",
        },
      ])
    }

    const updatedMailer = await this.mailerRepository.update(
      mailer,
      payload,
      team,
    )

    if (
      payload.configuration.domain ||
      (payload.configuration.email && !this.isReconnecting)
    ) {
      const mailerIdentityAction = container.resolve(CreateMailerIdentityAction)

      const mailerIdentityPayload: CreateMailerIdentityDto = {
        value: (payload.configuration.domain ?? payload.configuration.email)!,
        type: payload.configuration.domain ? "DOMAIN" : "EMAIL",
      }

      await mailerIdentityAction.handle(
        mailerIdentityPayload,
        updatedMailer!,
        team,
      )
    }

    return updatedMailer
  }
}
