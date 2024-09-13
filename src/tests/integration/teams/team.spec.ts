import { faker } from "@faker-js/faker"
import { describe, test } from "vitest"

import { createUser } from "@/tests/mocks/auth/users.js"
import { refreshDatabase } from "@/tests/mocks/teams/teams.js"
import { makeRequestAsUser } from "@/tests/utils/http.js"

describe("@teams", () => {
  test("can fetch a single team", async ({ expect }) => {
    await refreshDatabase()

    const { user, team } = await createUser()

    const showTeamResponse = await makeRequestAsUser(user, {
      method: "GET",
      path: `/teams/${team.id}`,
    })

    const json = await showTeamResponse.json()

    expect(json.name).toBe(team.name)
    expect(showTeamResponse.status).toBe(200)
  })
})
