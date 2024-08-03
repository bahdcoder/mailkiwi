import type { MailerConfiguration } from "@/shared/types/mailer.js";
import { CreateMailerIdentityAction } from "@/teams/actions/create_mailer_identity_action.js";
import type { CreateMailerIdentityDto } from "@/teams/dto/create_mailer_identity_dto.js";
import type { UpdateMailerDto } from "@/teams/dto/mailers/update_mailer_dto.js";
import { CheckProviderCredentials } from "@/teams/helpers/check_provider_credentials.js";
import { MailerRepository } from "@/teams/repositories/mailer_repository.js";
import { E_VALIDATION_FAILED } from "@/http/responses/errors.js";
import type { Mailer, Team } from "@/database/schema/types.js";
import { container } from "@/utils/typi.js";
import { MailerIdentityRepository } from "@/teams/repositories/mailer_identity_repository.js";
import { DeleteMailerIdentityAction } from "@/teams/actions/mailers/delete_mailer_identity_action.js";

export class UpdateMailerAction {
  protected isReconnecting = false;
  constructor(
    private mailerRepository: MailerRepository = container.make(
      MailerRepository,
    ),
    private mailerIdentityRepository: MailerIdentityRepository = container.make(
      MailerIdentityRepository,
    ),
  ) {}

  reconnecting() {
    this.isReconnecting = true;

    return this;
  }

  handle = async (mailer: Mailer, payload: UpdateMailerDto, team: Team) => {
    const configurationKeysAreValid = await new CheckProviderCredentials(
      payload.configuration as MailerConfiguration,
      mailer,
    ).execute();

    if (!configurationKeysAreValid) {
      throw E_VALIDATION_FAILED([
        {
          message: "The provided configuration is invalid.",
          field: "configuration",
        },
      ]);
    }

    const [existingMailerIdentity] =
      await this.mailerIdentityRepository.findManyByMailerId(mailer.id);

    if (existingMailerIdentity) {
      const deletedMailerIdentityAction = container.make(
        DeleteMailerIdentityAction,
      );

      await deletedMailerIdentityAction.handle(
        mailer,
        existingMailerIdentity,
        { deleteOnProvider: true },
        team,
      );
    }

    const updatedMailer = await this.mailerRepository.update(
      mailer,
      payload,
      team,
    );

    if (
      payload.configuration.domain ||
      (payload.configuration.email && !this.isReconnecting)
    ) {
      const mailerIdentityAction = container.resolve(
        CreateMailerIdentityAction,
      );

      const mailerIdentityPayload: CreateMailerIdentityDto = {
        value:
          payload.configuration.domain ?? payload.configuration.email ?? "",
        type: payload.configuration.domain ? "DOMAIN" : "EMAIL",
      };

      await mailerIdentityAction.handle(
        mailerIdentityPayload,
        updatedMailer,
        team,
      );
    }

    return updatedMailer;
  };
}
