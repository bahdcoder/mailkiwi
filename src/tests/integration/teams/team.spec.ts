import { faker } from "@faker-js/faker"
import { describe,test } from "vitest"

import { createUser } from "@/tests/mocks/auth/users"
import { cleanMailers } from "@/tests/mocks/teams/teams"
import { injectAsUser } from "@/tests/utils/http"

describe("Teams", () => {
  test("can fetch a single team", async ({ expect }) => {
    const { user, team } = await createUser()

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

    await injectAsUser(user, {
      method: "PATCH",
      path: `/mailers/${(await response.json()).id}`,
      body: {
        configuration: updateConfigPayload,
      },
    })

    const showTeamResponse = await injectAsUser(user, {
      method: "GET",
      path: `/teams/${team.id}`,
    })

    expect(showTeamResponse.statusCode).toBe(200)

    const json = await showTeamResponse.json()

    expect(json.name).toBe(team.name)

    await cleanMailers()
  })
})
