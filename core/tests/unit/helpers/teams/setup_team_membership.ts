import { appEnv } from '#root/core/app/env/app_env.js'
import { faker } from '@faker-js/faker'

import { TeamMembershipRepository } from '#root/core/teams/repositories/team_membership_repository.js'
import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import { createUser } from '#root/core/tests/mocks/auth/users.js'
import { makeRequestAsUser } from '#root/core/tests/utils/http.js'

import { SignedUrlManager } from '#root/core/shared/utils/links/signed_url_manager.js'

import { container } from '#root/core/utils/typi.js'

export const setupTeamMemberships = async (email?: string, role?: string) => {
  const { user, team } = await createUser()

  const body = {
    email: email || faker.internet.email(),
    role: role || 'MANAGER',
  }

  const response = await makeRequestAsUser(user, {
    method: 'POST',
    path: '/memberships',
    body,
  })

  const json = await response.json()

  const getInvite = async () => {
    const invite = await container.make(TeamMembershipRepository).findById(json?.id)

    const teamWithMembers = await container.make(TeamRepository).findById(team.id)

    const token = new SignedUrlManager(appEnv.APP_KEY).encode(
      invite?.id?.toString() as string,
      {},
    )

    return { teamWithMembers, invite, token }
  }

  return {
    body,
    response,
    user,
    team,
    getInvite,
  }
}
