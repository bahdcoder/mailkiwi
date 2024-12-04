import { appEnv } from "@/app/env/app_env.js"
import { InjectEmailAction } from "@/injector/actions/inject_email_action.js"
import { InjectEmailSchemaDto } from "@/injector/dto/inject_email_dto.js"
import { DateTime } from "luxon"

import { TeamRepository } from "@/teams/repositories/team_repository.js"

import { SendingDomainRepository } from "@/sending_domains/repositories/sending_domain_repository.js"

import { Contact, Website } from "@/database/database_schema_types.js"

import { E_OPERATION_FAILED } from "@/http/responses/errors.js"

import { SignedUrlManager } from "@/shared/utils/links/signed_url_manager.js"

import { container } from "@/utils/typi.js"

export class CreateContactSessionAction {
  constructor() {}

  async handle(
    contact: Pick<Contact, "id" | "email" | "firstName" | "lastName">,
    website: Website,
  ) {
    const signedUrl = new SignedUrlManager(appEnv.APP_KEY).encode(contact.id, {
      e: DateTime.now().toUTC().plus({ minutes: 60 }).toISO(),
    })

    const team = await container.make(TeamRepository).findById(website.teamId)

    const sendingDomain = await container
      .make(SendingDomainRepository)
      .getSendingDomainForTeam(website.teamId, "engage")

    // TODO: Generate html JSON template used for sending contact login email.
    // This JSON will be the same as the one sent from the frontend after building a broadcast email.
    if (!sendingDomain) {
      throw E_OPERATION_FAILED("No sending domain found for team.")
    }

    // TODO: Generate subject from website name
    // TODO: Replace with correct recipient and from information.

    const injectEmailPayload: InjectEmailSchemaDto = {
      from: {
        name: contact.firstName + " " + contact.lastName,
        email: contact.email,
      },
      recipients: [
        {
          name: contact.firstName + " " + contact.lastName,
          email: contact.email,
        },
      ],
      html: /*html*/ `<a href="${signedUrl}">Login with this magic link</a>`,
      text: /*html*/ `<a href="${signedUrl}">Login with this magic link</a>`,
      subject: `Here's your magic login link to access ${team.name}.`,
      attachments: [],
      headers: {
        // [appEnv.emailHeaders.broadcastId]: broadcast.id,
        // [appEnv.emailHeaders.contactId]: contact.id,
      },
      // subject: `Login to ${website.name}`,
      openTrackingEnabled: false,
      clickTrackingEnabled: false,
    }

    // return container
    //   .make(InjectEmailAction)
    //   .handle(injectEmailPayload, sendingDomain)
  }
}
