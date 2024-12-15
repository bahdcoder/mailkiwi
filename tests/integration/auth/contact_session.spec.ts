import { WEBSITES_PATH, appEnv } from "@/app/env/app_env.js"
import { faker } from "@faker-js/faker"
import { DateTime } from "luxon"
import { describe, test } from "vitest"

import { ContactRepository } from "@/audiences/repositories/contact_repository.js"

import { CreateSendingDomainAction } from "@/sending_domains/actions/create_sending_domain_action.js"

import { createUser } from "@/tests/mocks/auth/users.js"
import { makeRequest } from "@/tests/utils/http.js"

import { Audience } from "@/database/database_schema_types.js"

import { SignedUrlManager } from "@/shared/utils/links/signed_url_manager.js"

import { container } from "@/utils/typi.js"

describe("@contact-session", () => {
  test("can create a contact session", async ({ expect }) => {
    const { user, team, website, audience } = await createUser({
      createWebsite: true,
    })

    const contactEmail = faker.internet.email()

    await container
      .make(CreateSendingDomainAction)
      .handle({ name: faker.internet.domainName() }, team.id)

    await container
      .make(ContactRepository)
      .create({ email: contactEmail }, audience as Audience)

    const response = await makeRequest(`/${WEBSITES_PATH}/${website.slug}/sessions`, {
      method: "POST",
      body: { email: contactEmail },
    })

    expect(response.status).toBe(200)

    // TODO: Assert email was sent with signed url for contact
  })

  test("can confirm contact session creation using signed url", async ({ expect }) => {
    const { website, audience } = await createUser({
      createWebsite: true,
    })

    const contactEmail = faker.internet.email()

    const { id: contactId } = await container
      .make(ContactRepository)
      .create({ email: contactEmail }, audience as Audience)

    const signedContactSessionCreateUrl = new SignedUrlManager(appEnv.APP_KEY).encode(
      contactId,
      {
        e: DateTime.now().toUTC().plus({ minutes: 60 }).toISO(),
      },
    )

    const response = await makeRequest(
      `/${WEBSITES_PATH}/${website.slug}/sessions/${signedContactSessionCreateUrl}`,
      {
        method: "GET",
      },
    )

    expect(response.status).toBe(302)

    const [session] = response.headers.getSetCookie()

    expect(session).toContain("__Secure-contact_session=")
    expect(session).toContain("HttpOnly; Secure; SameSite=Lax")
  })
})
