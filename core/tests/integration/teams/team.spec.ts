import { faker } from '@faker-js/faker'
import { describe, test } from 'vitest'

import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import { createUser } from '#root/core/tests/mocks/auth/users.js'
import { makeRequestAsUser } from '#root/core/tests/utils/http.js'

import { teamMemberships } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { route } from '#root/core/shared/routes/route_aliases.js'
import { RedisSessionStore } from '#root/core/shared/sessions/stores/redis_session_store.js'

import { container } from '#root/core/utils/typi.js'

describe('@teams', () => {
  test('can create a new team', async ({ expect }) => {
    const { user } = await createUser()

    const teamName = faker.company.name()

    const createTeamResponse = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/teams',
      body: {
        name: teamName,
      },
    })

    const json = await createTeamResponse.json()

    expect(createTeamResponse.status).toBe(201)
    expect(json.payload.id).toBeDefined()
    expect(typeof json.payload.id).toBe('string')

    // Verify the team was actually created in the database
    const createdTeam = await container.make(TeamRepository).findById(json.payload.id)

    expect(createdTeam).toBeDefined()
    expect(createdTeam?.name).toBe(teamName)
    expect(createdTeam?.userId).toBe(user.id)

    // Verify the user was automatically switched to the new team
    const userActiveSessions = await container.make(RedisSessionStore).list(user.id)

    expect(userActiveSessions?.[0]?.currentTeamId).toBe(json.payload.id)
  })

  test('creating a team without name fails validation', async ({ expect }) => {
    const { user } = await createUser()

    const createTeamResponse = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/teams',
      body: {
        // Missing name field
      },
    })

    expect(createTeamResponse.status).toBe(422)

    const json = await createTeamResponse.json()

    expect(json.payload.errors).toBeDefined()
    expect(json.payload.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'name',
        }),
      ]),
    )
  })

  test('creating a team with empty name fails validation', async ({ expect }) => {
    const { user } = await createUser()

    const createTeamResponse = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/teams',
      body: {
        name: '',
      },
    })

    expect(createTeamResponse.status).toBe(422)

    const json = await createTeamResponse.json()

    expect(json.payload.errors).toBeDefined()
    expect(json.payload.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'name',
        }),
      ]),
    )
  })

  test('can fetch a single team', async ({ expect }) => {
    const { user, team } = await createUser()

    const showTeamResponse = await makeRequestAsUser(user, {
      method: 'GET',
      path: `/teams/${team.id}`,
    })

    const json = await showTeamResponse.json()

    expect(json.name).toBe(team.name)
    expect(showTeamResponse.status).toBe(200)
  })

  test('a user with multiple teams can switch between teams', async ({ expect }) => {
    const { user } = await createUser()
    const { team: secondTeam } = await createUser()

    await makeDatabase().insert(teamMemberships).values({
      userId: user.id,
      teamId: secondTeam.id,
      invitedAt: new Date(),
      expiresAt: new Date(),
      status: 'ACTIVE',
      role: 'MANAGER',
      email: user.email,
    })
    const response = await makeRequestAsUser(user, {
      method: 'GET',
      path: `/teams/${secondTeam.id}/switch`,
    })

    const json = await response.json()

    expect(json.type).toBe('redirect')
    expect(json.payload.path).toBe(route('dashboard'))

    const userActiveSessions = await container.make(RedisSessionStore).list(user.id)

    expect(userActiveSessions?.[0]?.currentTeamId).toBe(secondTeam.id)
  })
})
