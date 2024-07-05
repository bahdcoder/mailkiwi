import { faker } from "@faker-js/faker"
import { container } from "tsyringe"
import { describe, test, vi } from "vitest"

import { MailerRepository } from "@/domains/teams/repositories/mailer_repository"
import { makeDatabase } from "@/infrastructure/container"
import { createUser } from "@/tests/mocks/auth/users"
import { cleanMailers } from "@/tests/mocks/teams/teams"
import { injectAsUser } from "@/tests/utils/http"

vi.mock("@aws-sdk/client-ses", () => {
  const sesActual = vi.importActual("@aws-sdk/client-ses")

  return {
    ...sesActual,
    SESClient: class {
      send = vi.fn()
    },
  }
})

vi.mock("@aws-sdk/client-sns", () => {
  const snsActual = vi.importActual("@aws-sdk/client-sns")

  return {
    ...snsActual,
    SNSClient: class {
      send = vi.fn()
    },
  }
})

describe("Teams", () => {
  test("can create mailers", async ({ expect }) => {
    const { user } = await createUser()

    const mailerPayload = {
      name: faker.string.uuid(),
      provider: "AWS_SES",
    }

    const response = await injectAsUser(user, {
      method: "POST",
      path: "/mailers",
      body: mailerPayload,
    })

    const json = await response.json()

    expect(response.statusCode).toBe(200)
    expect(json.name).toBe(mailerPayload.name)
    expect(json.provider).toBe(mailerPayload.provider)

    await cleanMailers()
  })

  test.only("can update mailers", async ({ expect }) => {
    await cleanMailers()
    const { user, team } = await createUser()
    const database = makeDatabase()

    const mailerPayload = {
      name: faker.string.uuid(),
      provider: "AWS_SES",
    }

    const response = await injectAsUser(user, {
      method: "POST",
      path: "/mailers",
      body: mailerPayload,
    })

    const updateConfigPayload = {
      accessKey: faker.string.alphanumeric({ length: 16 }),
      accessSecret: faker.string.alphanumeric({ length: 16 }),
    }

    const updateResponse = await injectAsUser(user, {
      method: "PATCH",
      path: `/mailers/${(await response.json()).id}`,
      body: {
        configuration: updateConfigPayload,
      },
    })

    expect(updateResponse.statusCode).toBe(200)

    const mailerRepository = container.resolve(MailerRepository)

    const mailer = (await database.mailer.findFirst({
      where: {
        name: mailerPayload.name,
        provider: "AWS_SES",
      },
    }))!

    expect(mailer).not.toBeNull()

    const updatedConfiguration = mailerRepository.getDecryptedConfiguration(
      mailer?.configuration,
      team.configurationKey,
    )
    expect(updatedConfiguration.accessKey).toEqual(
      updateConfigPayload.accessKey,
    )
    expect(updatedConfiguration.accessSecret).toEqual(
      updateConfigPayload.accessSecret,
    )
  })
})
