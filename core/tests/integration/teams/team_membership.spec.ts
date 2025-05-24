import { appEnv } from '#root/core/app/env/app_env.js'
import { faker } from '@faker-js/faker'
import { DateTime } from 'luxon'
import { describe, test } from 'vitest'

import { SendTeamMemberInviteJob } from '#root/core/teams/jobs/send_team_member_invite_job.js'
import { TeamMembershipRepository } from '#root/core/teams/repositories/team_membership_repository.js'
import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import { createUser } from '#root/core/tests/mocks/auth/users.js'
import { makeRequestAsUser } from '#root/core/tests/utils/http.js'

import { Queue } from '#root/core/shared/queue/queue.js'
import { SignedUrlManager } from '#root/core/shared/utils/links/signed_url_manager.js'
import { RedisSessionStore } from '#root/core/shared/sessions/stores/redis_session_store.js'

import { container } from '#root/core/utils/typi.js'

const setup = async (email?: string, role?: string) => {
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

describe('@memberships', () => {
  describe('Invites', () => {
    test('can invite a new member via email to a team', async ({ expect }) => {
      const { response, body, getInvite } = await setup()

      expect(response.status).toBe(200)

      const { invite, teamWithMembers } = await getInvite()

      expect(teamWithMembers?.members).toHaveLength(1)
      expect(invite?.role).toEqual(body.role)
      expect(invite?.status).toEqual('PENDING')
      expect(invite?.email).toEqual(body.email)

      const expiresInDays = DateTime.fromJSDate(invite?.expiresAt as Date).diffNow('days')

      expect(Number.parseInt(expiresInDays.days.toString())).toBeGreaterThanOrEqual(6)
      expect(Number.parseInt(expiresInDays.days.toString())).toBeLessThanOrEqual(8)
    })

    test('can invite an existing user to a team', async ({ expect }) => {
      const { user, team } = await createUser()
      const { user: userTwo } = await createUser()

      const body = {
        email: userTwo.email,
        role: 'ADMINISTRATOR',
      }

      const response = await makeRequestAsUser(user, {
        method: 'POST',
        path: '/memberships',
        body,
      })

      expect(response.status).toBe(200)

      const teamWithMembers = await container.make(TeamRepository).findById(team.id)

      expect(teamWithMembers?.members).toHaveLength(1)

      const invite = teamWithMembers?.members?.[0]

      expect(invite?.userId).toEqual(userTwo.id)
    })

    test('dispatches a job that sends an email to invite the team member', async ({
      expect,
    }) => {
      const { response, getInvite } = await setup()

      const { invite } = await getInvite()
      expect(response.status).toBe(200)

      const jobs = await Queue.accounts().getJobs()

      const accountJobs = jobs.filter((job) => job.data.inviteId === invite.id)

      expect(accountJobs).toHaveLength(1)

      const job = accountJobs?.[0]

      expect(job?.name).toEqual(SendTeamMemberInviteJob.id)

      expect(job?.data).toEqual({ inviteId: invite?.id })
    })

    test('does not invite member if invalid payload is provided', async ({ expect }) => {
      const { user, team } = await createUser()

      const body = {
        email: 'invalid-email',
        role: 'INVALID_ROLE',
      }

      const response = await makeRequestAsUser(user, {
        method: 'POST',
        path: '/memberships',
        body,
      })

      const json = await response.json()

      expect(json.payload.errors.map((error: { field: string }) => error.field)).toEqual([
        'email',
        'role',
      ])
    })
  })

  describe('Accept and reject invites', () => {
    test('can accept an invite to join a team', async ({ expect }) => {
      const { user: invitedUser } = await createUser()
      const { team, body, getInvite, user } = await setup(invitedUser.email)
      const { token } = await getInvite()

      const response = await makeRequestAsUser(
        invitedUser,
        {
          method: 'PUT',
          path: `/memberships/${token}`,
          body,
        },
        team.id,
      )

      expect(response.status).toBe(200)

      const teamWithMembers = await container.make(TeamRepository).findById(team.id)

      expect(teamWithMembers?.members).toHaveLength(1)
      expect(teamWithMembers?.members?.[0]?.status).toEqual('ACTIVE')
    })

    test('only the invited authorized user can accept an invite to join a team', async ({
      expect,
    }) => {
      const { user: invitedUser } = await createUser()
      const { user: thirdUser } = await createUser()
      const { team, body, getInvite } = await setup(invitedUser.email)
      const { token } = await getInvite()

      const response = await makeRequestAsUser(thirdUser, {
        method: 'PUT',
        path: `/memberships/${token}`,
        body,
      })

      expect(response.status).toBe(401)

      const teamWithMembers = await container.make(TeamRepository).findById(team.id)

      expect(teamWithMembers?.members).toHaveLength(1)
      expect(teamWithMembers?.members?.[0]?.status).toEqual('PENDING')
    })

    test('can reject an invite to join a team', async ({ expect }) => {
      const { user: invitedUser } = await createUser()
      const { team, body, getInvite } = await setup(invitedUser.email)
      const { token } = await getInvite()

      const response = await makeRequestAsUser(
        invitedUser,
        {
          method: 'DELETE',
          path: `/memberships/${token}`,
          body,
        },
        team.id,
      )

      expect(response.status).toBe(200)

      const teamWithMembers = await container.make(TeamRepository).findById(team.id)

      expect(teamWithMembers?.members).toHaveLength(0)
    })

    test('only the invited authorized user can reject an invite to join a team', async ({
      expect,
    }) => {
      const { user: invitedUser } = await createUser()
      const { user: thirdUser } = await createUser()
      const { team, body, getInvite } = await setup(invitedUser.email)
      const { token } = await getInvite()

      const response = await makeRequestAsUser(
        thirdUser,
        {
          method: 'DELETE',
          path: `/memberships/${token}`,
          body,
        },
        team.id,
      )

      expect(response.status).toBe(401)

      const teamWithMembers = await container.make(TeamRepository).findById(team.id)

      expect(teamWithMembers?.members).toHaveLength(1)
      expect(teamWithMembers?.members?.[0]?.status).toEqual('PENDING')
    })
  })

  describe('Revoke team member access', () => {
    test("can revoke a team member's access", async ({ expect }) => {
      const { user: invitedUser } = await createUser()
      const { team, body, getInvite, user } = await setup(invitedUser.email)

      const { token, invite } = await getInvite()

      await makeRequestAsUser(
        invitedUser,
        {
          method: 'PUT',
          path: `/memberships/${token}`,
          body,
        },
        team.id,
      )

      const teamWithMembers = await container.make(TeamRepository).findById(team.id)

      expect(teamWithMembers?.members).toHaveLength(1)

      const response = await makeRequestAsUser(
        user,
        {
          method: 'DELETE',
          path: `/memberships/${invite?.id}/access`,
          body,
        },
        team.id,
      )

      expect(response.status).toBe(200)

      const teamWithMembersAfterRevokedAccess = await container
        .make(TeamRepository)
        .findById(team.id)

      expect(teamWithMembersAfterRevokedAccess?.members).toHaveLength(0)
    })

    test('only an administrator can revoke team member access', async ({ expect }) => {
      const { user: invitedUser } = await createUser()
      const { user: secondInvitedUser } = await createUser()
      const { team, body, getInvite } = await setup(invitedUser.email, 'ADMINISTRATOR')

      // add another user to the team as an author
      await container.make(TeamMembershipRepository).create({
        email: secondInvitedUser.email,
        userId: secondInvitedUser.id,
        status: 'ACTIVE',
        teamId: team.id,
        expiresAt: new Date(),
        role: 'AUTHOR',
      })

      const { token, invite } = await getInvite()

      await makeRequestAsUser(
        invitedUser,
        {
          method: 'PUT',
          path: `/memberships/${token}`,
          body,
        },
        team.id,
      )

      const teamWithMembers = await container.make(TeamRepository).findById(team.id)

      expect(teamWithMembers?.members).toHaveLength(2)

      // attempt to revoke access while being an author
      const response = await makeRequestAsUser(
        secondInvitedUser,
        {
          method: 'DELETE',
          path: `/memberships/${invite?.id}/access`,
          body,
        },
        team.id,
      )

      expect(response.status).toBe(401)

      const teamWithMembersAfterRevokedAccess = await container
        .make(TeamRepository)
        .findById(team.id)

      expect(teamWithMembersAfterRevokedAccess?.members).toHaveLength(2)
    })

    test('a user can revoke their own access from a team', async ({ expect }) => {
      const { user: invitedUser } = await createUser()
      const { user: secondInvitedUser } = await createUser()
      const { team, body, getInvite, user } = await setup(
        invitedUser.email,
        'ADMINISTRATOR',
      )

      // add another user to the team as an author
      const secondInvitedUserMembership = await container
        .make(TeamMembershipRepository)
        .create({
          email: secondInvitedUser.email,
          userId: secondInvitedUser.id,
          status: 'ACTIVE',
          teamId: team.id,
          expiresAt: new Date(),
          role: 'AUTHOR',
        })

      const { token } = await getInvite()

      await makeRequestAsUser(invitedUser, {
        method: 'PUT',
        path: `/memberships/${token}`,
        body,
      })

      const teamWithMembers = await container.make(TeamRepository).findById(team.id)

      expect(teamWithMembers?.members).toHaveLength(2)

      // attempt to revoke access while being an author
      const response = await makeRequestAsUser(
        secondInvitedUser,
        {
          method: 'DELETE',
          path: `/memberships/${secondInvitedUserMembership.id}/access`,
          body,
        },
        team.id,
      )

      expect(response.status).toBe(200)

      const teamWithMembersAfterRevokedAccess = await container
        .make(TeamRepository)
        .findById(team.id)

      expect(teamWithMembersAfterRevokedAccess?.members).toHaveLength(1)
    })
  })

  describe('Leave team', () => {
    test('a team member can leave a team', async ({ expect }) => {
      const { user: teamOwner, team } = await createUser()
      const { user: teamMember } = await createUser()

      const membershipId = await container.make(TeamMembershipRepository).create({
        email: teamMember.email,
        userId: teamMember.id,
        status: 'ACTIVE',
        teamId: team.id,
        expiresAt: new Date(),
        role: 'MANAGER',
      })

      const teamWithMembersBefore = await container.make(TeamRepository).findById(team.id)
      expect(teamWithMembersBefore?.members).toHaveLength(1)

      const response = await makeRequestAsUser(
        teamMember,
        {
          method: 'DELETE',
          path: '/memberships/leave',
        },
        team.id,
      )

      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json.id).toBe(membershipId.id)

      const teamWithMembersAfter = await container.make(TeamRepository).findById(team.id)
      expect(teamWithMembersAfter?.members).toHaveLength(0)
    })

    test('team owner cannot leave their own team', async ({ expect }) => {
      const { user: teamOwner, team } = await createUser()

      const response = await makeRequestAsUser(
        teamOwner,
        {
          method: 'DELETE',
          path: '/memberships/leave',
        },
        team.id,
      )

      expect(response.status).toBe(401)
    })

    test('non-member cannot leave a team', async ({ expect }) => {
      const { team } = await createUser()
      const { user: nonMember } = await createUser()

      const response = await makeRequestAsUser(
        nonMember,
        {
          method: 'DELETE',
          path: '/memberships/leave',
        },
        team.id,
      )

      expect(response.status).toBe(422)

      const json = await response.json()
      expect(json.payload.errors[0].message).toBe('You are not a member of this team.')
    })

    test('leaving a team removes membership successfully', async ({ expect }) => {
      const { team: ownerTeam } = await createUser()
      const { user: teamMember } = await createUser()

      const membershipId = await container.make(TeamMembershipRepository).create({
        email: teamMember.email,
        userId: teamMember.id,
        status: 'ACTIVE',
        teamId: ownerTeam.id,
        expiresAt: new Date(),
        role: 'MANAGER',
      })

      const teamWithMembersBefore = await container
        .make(TeamRepository)
        .findById(ownerTeam.id)
      expect(teamWithMembersBefore?.members).toHaveLength(1)

      const response = await makeRequestAsUser(
        teamMember,
        {
          method: 'DELETE',
          path: '/memberships/leave',
        },
        ownerTeam.id,
      )

      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json.id).toBe(membershipId.id)

      const teamWithMembersAfter = await container
        .make(TeamRepository)
        .findById(ownerTeam.id)
      expect(teamWithMembersAfter?.members).toHaveLength(0)
    })
  })

  describe('Update team member role', () => {
    test('administrator can update team member role', async ({ expect }) => {
      const { user: teamOwner, team } = await createUser()
      const { user: teamMember } = await createUser()

      const membershipId = await container.make(TeamMembershipRepository).create({
        email: teamMember.email,
        userId: teamMember.id,
        status: 'ACTIVE',
        teamId: team.id,
        expiresAt: new Date(),
        role: 'AUTHOR',
      })

      const response = await makeRequestAsUser(
        teamOwner,
        {
          method: 'PUT',
          path: `/memberships/${membershipId.id}/role`,
          body: { role: 'MANAGER' },
        },
        team.id,
      )

      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json.id).toBe(membershipId.id)

      const updatedMembership = await container
        .make(TeamMembershipRepository)
        .findById(membershipId.id)
      expect(updatedMembership?.role).toBe('MANAGER')
    })

    test('only administrators can update team member roles', async ({ expect }) => {
      const { user: teamOwner, team } = await createUser()
      const { user: teamMember } = await createUser()
      const { user: anotherMember } = await createUser()

      const membershipId = await container.make(TeamMembershipRepository).create({
        email: teamMember.email,
        userId: teamMember.id,
        status: 'ACTIVE',
        teamId: team.id,
        expiresAt: new Date(),
        role: 'AUTHOR',
      })

      await container.make(TeamMembershipRepository).create({
        email: anotherMember.email,
        userId: anotherMember.id,
        status: 'ACTIVE',
        teamId: team.id,
        expiresAt: new Date(),
        role: 'MANAGER',
      })

      const response = await makeRequestAsUser(
        anotherMember,
        {
          method: 'PUT',
          path: `/memberships/${membershipId.id}/role`,
          body: { role: 'MANAGER' },
        },
        team.id,
      )

      expect(response.status).toBe(401)

      // Verify the role was not updated
      const unchangedMembership = await container
        .make(TeamMembershipRepository)
        .findById(membershipId.id)
      expect(unchangedMembership?.role).toBe('AUTHOR')
    })

    test('cannot update role with invalid role value', async ({ expect }) => {
      const { user: teamOwner, team } = await createUser()
      const { user: teamMember } = await createUser()

      const membershipId = await container.make(TeamMembershipRepository).create({
        email: teamMember.email,
        userId: teamMember.id,
        status: 'ACTIVE',
        teamId: team.id,
        expiresAt: new Date(),
        role: 'AUTHOR',
      })

      const response = await makeRequestAsUser(
        teamOwner,
        {
          method: 'PUT',
          path: `/memberships/${membershipId.id}/role`,
          body: { role: 'INVALID_ROLE' },
        },
        team.id,
      )

      expect(response.status).toBe(422)

      const json = await response.json()
      expect(json.payload.errors[0].field).toBe('role')
    })

    test('cannot update role of inactive membership', async ({ expect }) => {
      const { user: teamOwner, team } = await createUser()
      const { user: teamMember } = await createUser()

      const membershipId = await container.make(TeamMembershipRepository).create({
        email: teamMember.email,
        userId: teamMember.id,
        status: 'PENDING',
        teamId: team.id,
        expiresAt: new Date(),
        role: 'AUTHOR',
      })

      const response = await makeRequestAsUser(
        teamOwner,
        {
          method: 'PUT',
          path: `/memberships/${membershipId.id}/role`,
          body: { role: 'MANAGER' },
        },
        team.id,
      )

      expect(response.status).toBe(422)

      const json = await response.json()
      expect(json.payload.errors[0].message).toBe(
        'Only active team members can have their roles updated.',
      )
    })
  })

  describe('Resend team member invitation', () => {
    test('administrator can resend invitation to pending member', async ({ expect }) => {
      const { user: teamOwner, team } = await createUser()
      const { user: invitedUser } = await createUser()

      const membershipId = await container.make(TeamMembershipRepository).create({
        email: invitedUser.email,
        userId: invitedUser.id,
        status: 'PENDING',
        teamId: team.id,
        expiresAt: new Date(),
        role: 'AUTHOR',
      })

      const response = await makeRequestAsUser(
        teamOwner,
        {
          method: 'POST',
          path: `/memberships/${membershipId.id}/resend`,
        },
        team.id,
      )

      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json.id).toBe(membershipId.id)

      const updatedMembership = await container
        .make(TeamMembershipRepository)
        .findById(membershipId.id)

      const expiresInDays = DateTime.fromJSDate(
        updatedMembership?.expiresAt as Date,
      ).diffNow('days')
      expect(Number.parseInt(expiresInDays.days.toString())).toBeGreaterThanOrEqual(6)
      expect(Number.parseInt(expiresInDays.days.toString())).toBeLessThanOrEqual(8)

      const jobs = await Queue.accounts().getJobs()
      const accountJobs = jobs.filter((job) => job.data.inviteId === membershipId.id)
      expect(accountJobs.length).toBeGreaterThanOrEqual(1)

      const latestJob = accountJobs[accountJobs.length - 1]
      expect(latestJob?.name).toEqual(SendTeamMemberInviteJob.id)
      expect(latestJob?.data).toEqual({ inviteId: membershipId.id })
    })

    test('only administrators can resend invitations', async ({ expect }) => {
      const { user: teamOwner, team } = await createUser()
      const { user: teamMember } = await createUser()
      const { user: invitedUser } = await createUser()

      await container.make(TeamMembershipRepository).create({
        email: teamMember.email,
        userId: teamMember.id,
        status: 'ACTIVE',
        teamId: team.id,
        expiresAt: new Date(),
        role: 'MANAGER',
      })

      const membershipId = await container.make(TeamMembershipRepository).create({
        email: invitedUser.email,
        userId: invitedUser.id,
        status: 'PENDING',
        teamId: team.id,
        expiresAt: new Date(),
        role: 'AUTHOR',
      })

      const response = await makeRequestAsUser(
        teamMember,
        {
          method: 'POST',
          path: `/memberships/${membershipId.id}/resend`,
        },
        team.id,
      )

      expect(response.status).toBe(401)
    })

    test('cannot resend invitation for active member', async ({ expect }) => {
      const { user: teamOwner, team } = await createUser()
      const { user: activeMember } = await createUser()

      const membershipId = await container.make(TeamMembershipRepository).create({
        email: activeMember.email,
        userId: activeMember.id,
        status: 'ACTIVE',
        teamId: team.id,
        expiresAt: new Date(),
        role: 'AUTHOR',
      })

      const response = await makeRequestAsUser(
        teamOwner,
        {
          method: 'POST',
          path: `/memberships/${membershipId.id}/resend`,
        },
        team.id,
      )

      expect(response.status).toBe(422)

      const json = await response.json()
      expect(json.payload.errors[0].message).toBe(
        'Only pending invitations can be resent.',
      )
    })

    test('cannot resend invitation for membership from different team', async ({
      expect,
    }) => {
      const { user: teamOwner, team } = await createUser()
      const { team: otherTeam } = await createUser()
      const { user: invitedUser } = await createUser()

      const membershipId = await container.make(TeamMembershipRepository).create({
        email: invitedUser.email,
        userId: invitedUser.id,
        status: 'PENDING',
        teamId: otherTeam.id,
        expiresAt: new Date(),
        role: 'AUTHOR',
      })

      const response = await makeRequestAsUser(
        teamOwner,
        {
          method: 'POST',
          path: `/memberships/${membershipId.id}/resend`,
        },
        team.id,
      )

      expect(response.status).toBe(401)
    })

    test('can resend invitation for expired pending member', async ({ expect }) => {
      const { user: teamOwner, team } = await createUser()
      const { user: invitedUser } = await createUser()

      const membershipId = await container.make(TeamMembershipRepository).create({
        email: invitedUser.email,
        userId: invitedUser.id,
        status: 'PENDING',
        teamId: team.id,
        expiresAt: DateTime.now().minus({ days: 1 }).toJSDate(), // Expired yesterday
        role: 'AUTHOR',
      })

      const response = await makeRequestAsUser(
        teamOwner,
        {
          method: 'POST',
          path: `/memberships/${membershipId.id}/resend`,
        },
        team.id,
      )

      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json.id).toBe(membershipId.id)

      const updatedMembership = await container
        .make(TeamMembershipRepository)
        .findById(membershipId.id)

      const expiresInDays = DateTime.fromJSDate(
        updatedMembership?.expiresAt as Date,
      ).diffNow('days')
      expect(Number.parseInt(expiresInDays.days.toString())).toBeGreaterThanOrEqual(6)
      expect(Number.parseInt(expiresInDays.days.toString())).toBeLessThanOrEqual(8)
    })
  })
})
