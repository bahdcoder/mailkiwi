import { faker } from "@faker-js/faker"
import { and, eq } from "drizzle-orm"
import { describe, test } from "vitest"

import { createUser } from "@/tests/mocks/auth/users.js"
import { refreshDatabase } from "@/tests/mocks/teams/teams.js"
import { makeRequest, makeRequestAsUser } from "@/tests/utils/http.js"

import { audiences, contacts } from "@/database/schema/schema.js"

import { makeConfig, makeDatabase } from "@/shared/container/index.js"

describe("@audiences", () => {
  test("can create an audience only if authenticated", async ({
    expect,
  }) => {
    const response = await makeRequest("audiences", {
      method: "POST",
    })

    expect(response.status).toBe(401)
  })

  test("cannot create an audience if not a member of the team or project", async ({
    expect,
  }) => {
    const { team } = await createUser()
    const { user: unauthorisedUser } = await createUser()

    const response = await makeRequestAsUser(
      unauthorisedUser,
      {
        method: "POST",
        path: "/audiences",
        body: {
          name: faker.commerce.productName(),
        },
      },
      team.id,
    )

    expect(response.status).toBe(401)
  })

  test("managers on a team can create audiences", async ({ expect }) => {
    const { team, managerUser } = await createUser({
      createEntireTeam: true,
    })

    const response = await makeRequestAsUser(
      managerUser,
      {
        method: "POST",
        path: "/audiences",
        body: {
          name: faker.commerce.productName(),
        },
      },
      team.id,
    )

    expect(response.status).toBe(200)
  })

  test("can create an audience when properly authenticated and authorized", async ({
    expect,
  }) => {
    await refreshDatabase()

    const { user } = await createUser()
    const database = makeDatabase()

    const payload = {
      name: faker.commerce.productName(),
    }

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: "/audiences",
      body: payload,
    })

    expect(response.status).toBe(200)

    const audience = await database.query.audiences.findFirst({
      where: and(
        eq(audiences.teamId, user?.teams?.[0]?.id),
        eq(audiences.name, payload.name),
      ),
    })

    expect(audience).toBeDefined()
    expect(audience?.name).toEqual(payload.name)
  })

  test("can only create an audience when properly authorized", async ({
    expect,
  }) => {
    const { user } = await createUser()

    const { user: unauthorizedUser } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: "/audiences",
      body: {
        name: "Newsletter",
      },
      headers: {
        [makeConfig().software.teamHeader]:
          unauthorizedUser?.teams?.[0]?.id,
      },
    })

    expect(response.status).toBe(401)
  })
})
