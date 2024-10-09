import { faker } from "@faker-js/faker"
import { describe, test } from "vitest"

import { createUser } from "@/tests/mocks/auth/users.js"
import { makeRequestAsUser } from "@/tests/utils/http.js"

describe("@teams", () => {
  test("can fetch a single team", async ({ expect }) => {
    const { user, team } = await createUser()

    const showTeamResponse = await makeRequestAsUser(user, {
      method: "GET",
      path: `/teams/${team.id}`,
    })

    const json = await showTeamResponse.json()

    d(json)

    expect(json.name).toBe(team.name)
    expect(showTeamResponse.status).toBe(200)
  })
})
