import { apiEnv } from "@/api/env/api_env.js"
import { faker } from "@faker-js/faker"
import { and, eq } from "drizzle-orm"
import { describe, test } from "vitest"

import { AudienceRepository } from "@/audiences/repositories/audience_repository.js"

import { createUser } from "@/tests/mocks/auth/users.js"
import { makeRequest, makeRequestAsUser } from "@/tests/utils/http.js"

import { audiences } from "@/database/schema.js"

import { makeDatabase } from "@/shared/container/index.js"

import { container } from "@/utils/typi.js"

describe("@audiences", () => {
  test("can create an audience only if authenticated", async ({
    expect,
  }) => {
    const response = await makeRequest("audiences", {
      method: "POST",
    })

    expect(response.status).toBe(401)
  })

  test("can fetch all created audiences and filter by product", async ({
    expect,
  }) => {
    const { team, user } = await createUser()
    const database = makeDatabase()

    const inserts = faker.helpers.multiple(
      () => ({
        name: faker.lorem.words(3),
        slug: faker.lorem.words(5),
        product: "engage" as const,
        teamId: team.id,
      }),
      { count: 50 },
    )

    await database.insert(audiences).values(inserts)

    const response = await makeRequestAsUser(
      user,
      {
        method: "GET",
        path: "/audiences",
      },
      team.id,
    )

    const json = await response.json()

    expect(response.status).toBe(200)

    expect(json.data).toHaveLength(10)
    expect(json.next).toBeDefined()
  })

  test("can fetch audiences filtered by product", async ({ expect }) => {
    const { team, user } = await createUser()
    const database = makeDatabase()

    const inserts = faker.helpers.multiple(
      () => ({
        name: faker.lorem.words(3),
        slug: faker.lorem.words(5),
        product: "engage" as const,
        teamId: team.id,
      }),
      { count: 50 },
    )

    await database.insert(audiences).values({
      name: faker.lorem.words(3),
      slug: faker.lorem.words(3),
      product: "letters",
      description: faker.lorem.paragraph(),
      teamId: team.id,
    })

    await database.insert(audiences).values(inserts)

    const response = await makeRequestAsUser(
      user,
      {
        method: "GET",
        path: "/audiences?product=letters",
      },
      team.id,
    )

    const json = await response.json()

    expect(response.status).toBe(200)

    expect(json.data).toHaveLength(1)
    expect(json.finished).toBe(true)
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
        [apiEnv.software.teamHeader]:
          unauthorizedUser?.teams?.[0]?.id?.toString(),
      },
    })

    expect(response.status).toBe(401)
  })
})
