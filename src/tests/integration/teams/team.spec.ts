import { faker } from "@faker-js/faker"
import { describe, test } from "vitest"

import { createUser } from "@/tests/mocks/auth/users.js"
import { refreshDatabase } from "@/tests/mocks/teams/teams.js"
import { makeRequestAsUser } from "@/tests/utils/http.js"

describe("Teams", () => {
  test("can fetch a single team", async ({ expect }) => {
    await refreshDatabase()
    const { user, team } = await createUser()

    const mailerPayload = {
      name: faker.string.uuid(),
      provider: "AWS_SES",
    }

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: "/mailers",
      body: mailerPayload,
    })

    const updateConfigPayload = {
      accessKey: faker.string.alphanumeric({ length: 16 }),
      accessSecret: faker.string.alphanumeric({ length: 16 }),
    }

    await makeRequestAsUser(user, {
      method: "PATCH",
      path: `/mailers/${(await response.json()).id}`,
      body: {
        configuration: updateConfigPayload,
      },
    })

    const showTeamResponse = await makeRequestAsUser(user, {
      method: "GET",
      path: `/teams/${team.id}`,
    })

    const json = await showTeamResponse.json()

    expect(json.name).toBe(team.name)
    expect(showTeamResponse.status).toBe(200)

    await refreshDatabase()
  })
})
