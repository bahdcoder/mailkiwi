import { apiEnv } from "@/api/env/api_env.js"
import { faker } from "@faker-js/faker"
import { DateTime } from "luxon"
import { describe, test } from "vitest"

import { SendTeamMemberInviteJob } from "@/teams/jobs/send_team_member_invite_job.js"
import { TeamMembershipRepository } from "@/teams/repositories/team_membership_repository.js"
import { TeamRepository } from "@/teams/repositories/team_repository.js"

import { createUser } from "@/tests/mocks/auth/users.js"
import { makeRequestAsUser } from "@/tests/utils/http.js"

import { Queue } from "@/shared/queue/queue.js"
import { SignedUrlManager } from "@/shared/utils/links/signed_url_manager.js"

import { container } from "@/utils/typi.js"

export const setup = async (email?: string, role?: string) => {
  const { user, team } = await createUser()

  const body = {
    email: email || faker.internet.email(),
    role: role || "MANAGER",
  }

  const response = await makeRequestAsUser(user, {
    method: "POST",
    path: `/memberships`,
    body,
  })

  const json = await response.json()

  const getInvite = async () => {
    const invite = await container
      .make(TeamMembershipRepository)
      .findById(json?.id)

    const teamWithMembers = await container
      .make(TeamRepository)
      .findById(team.id)

    const token = new SignedUrlManager(apiEnv.APP_KEY).encode(
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

describe("@memberships", () => {
  describe("Invites", () => {
    test("can invite a new member via email to a team", async ({
      expect,
    }) => {
      const { response, body, getInvite } = await setup()

      expect(response.status).toBe(200)

      const { invite, teamWithMembers } = await getInvite()

      expect(teamWithMembers?.members).toHaveLength(1)
      expect(invite?.role).toEqual(body.role)
      expect(invite?.status).toEqual("PENDING")
      expect(invite?.email).toEqual(body.email)

      const expiresInDays = DateTime.fromJSDate(
        invite?.expiresAt as Date,
      ).diffNow("days")

      expect(
        parseInt(expiresInDays.days.toString()),
      ).toBeGreaterThanOrEqual(6)
      expect(parseInt(expiresInDays.days.toString())).toBeLessThanOrEqual(
        8,
      )
    })

    test("can invite an existing user to a team", async ({ expect }) => {
      const { user, team } = await createUser()
      const { user: userTwo } = await createUser()

      const body = {
        email: userTwo.email,
        role: "ADMINISTRATOR",
      }

      const response = await makeRequestAsUser(user, {
        method: "POST",
        path: `/memberships`,
        body,
      })

      expect(response.status).toBe(200)

      const teamWithMembers = await container
        .make(TeamRepository)
        .findById(team.id)

      expect(teamWithMembers?.members).toHaveLength(1)

      const invite = teamWithMembers?.members?.[0]

      expect(invite?.userId).toEqual(userTwo.id)
    })

    test("dispatches a job that sends an email to invite the team member", async ({
      expect,
    }) => {
      const { response, getInvite } = await setup()

      const { invite } = await getInvite()
      expect(response.status).toBe(200)

      const jobs = await Queue.accounts().getJobs()

      const accountJobs = jobs.filter(
        (job) => job.data.inviteId === invite.id,
      )

      expect(accountJobs).toHaveLength(1)

      const job = accountJobs?.[0]

      expect(job?.name).toEqual(SendTeamMemberInviteJob.id)

      expect(job?.data).toEqual({ inviteId: invite?.id })
    })

    test("does not invite member if invalid payload is provided", async ({
      expect,
    }) => {
      const { user, team } = await createUser()

      const body = {
        email: "invalid-email",
        role: "INVALID_ROLE",
      }

      const response = await makeRequestAsUser(user, {
        method: "POST",
        path: `/memberships`,
        body,
      })

      const json = await response.json()

      expect(
        json.errors.map((error: { field: string }) => error.field),
      ).toEqual(["email", "role"])
    })
  })

  describe("Accept and reject invites", () => {
    test("can accept an invite to join a team", async ({ expect }) => {
      const { user: invitedUser } = await createUser()
      const { team, body, getInvite, user } = await setup(
        invitedUser.email,
      )
      const { token } = await getInvite()

      const response = await makeRequestAsUser(
        invitedUser,
        {
          method: "PUT",
          path: `/memberships/${token}`,
          body,
        },
        team.id,
      )

      expect(response.status).toBe(200)

      const teamWithMembers = await container
        .make(TeamRepository)
        .findById(team.id)

      expect(teamWithMembers?.members).toHaveLength(1)
      expect(teamWithMembers?.members?.[0]?.status).toEqual("ACTIVE")
    })

    test("only the invited authorized user can accept an invite to join a team", async ({
      expect,
    }) => {
      const { user: invitedUser } = await createUser()
      const { user: thirdUser } = await createUser()
      const { team, body, getInvite } = await setup(invitedUser.email)
      const { token } = await getInvite()

      const response = await makeRequestAsUser(thirdUser, {
        method: "PUT",
        path: `/memberships/${token}`,
        body,
      })

      expect(response.status).toBe(401)

      const teamWithMembers = await container
        .make(TeamRepository)
        .findById(team.id)

      expect(teamWithMembers?.members).toHaveLength(1)
      expect(teamWithMembers?.members?.[0]?.status).toEqual("PENDING")
    })

    test("can reject an invite to join a team", async ({ expect }) => {
      const { user: invitedUser } = await createUser()
      const { team, body, getInvite, user } = await setup(
        invitedUser.email,
      )
      const { token } = await getInvite()

      const response = await makeRequestAsUser(
        invitedUser,
        {
          method: "DELETE",
          path: `/memberships/${token}`,
          body,
        },
        team.id,
      )

      expect(response.status).toBe(200)

      const teamWithMembers = await container
        .make(TeamRepository)
        .findById(team.id)

      expect(teamWithMembers?.members).toHaveLength(0)
    })

    test("only the invited authorized user can reject an invite to join a team", async ({
      expect,
    }) => {
      const { user: invitedUser } = await createUser()
      const { user: thirdUser } = await createUser()
      const { team, body, getInvite } = await setup(invitedUser.email)
      const { token } = await getInvite()

      const response = await makeRequestAsUser(
        thirdUser,
        {
          method: "DELETE",
          path: `/memberships/${token}`,
          body,
        },
        team.id,
      )

      expect(response.status).toBe(401)

      const teamWithMembers = await container
        .make(TeamRepository)
        .findById(team.id)

      expect(teamWithMembers?.members).toHaveLength(1)
      expect(teamWithMembers?.members?.[0]?.status).toEqual("PENDING")
    })
  })

  describe("Revoke team member access", () => {
    test("can revoke a team member's access", async ({ expect }) => {
      const { user: invitedUser } = await createUser()
      const { team, body, getInvite, user } = await setup(
        invitedUser.email,
      )

      const { token, invite } = await getInvite()

      await makeRequestAsUser(
        invitedUser,
        {
          method: "PUT",
          path: `/memberships/${token}`,
          body,
        },
        team.id,
      )

      const teamWithMembers = await container
        .make(TeamRepository)
        .findById(team.id)

      expect(teamWithMembers?.members).toHaveLength(1)

      const response = await makeRequestAsUser(
        user,
        {
          method: "DELETE",
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

    test("only an administrator can revoke team member access", async ({
      expect,
    }) => {
      const { user: invitedUser } = await createUser()
      const { user: secondInvitedUser } = await createUser()
      const { team, body, getInvite } = await setup(
        invitedUser.email,
        "ADMINISTRATOR",
      )

      // add another user to the team as an author
      await container.make(TeamMembershipRepository).create({
        email: secondInvitedUser.email,
        userId: secondInvitedUser.id,
        status: "ACTIVE",
        teamId: team.id,
        expiresAt: new Date(),
        role: "AUTHOR",
      })

      const { token, invite } = await getInvite()

      await makeRequestAsUser(
        invitedUser,
        {
          method: "PUT",
          path: `/memberships/${token}`,
          body,
        },
        team.id,
      )

      const teamWithMembers = await container
        .make(TeamRepository)
        .findById(team.id)

      expect(teamWithMembers?.members).toHaveLength(2)

      // attempt to revoke access while being an author
      const response = await makeRequestAsUser(
        secondInvitedUser,
        {
          method: "DELETE",
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

    test("a user can revoke their own access from a team", async ({
      expect,
    }) => {
      const { user: invitedUser } = await createUser()
      const { user: secondInvitedUser } = await createUser()
      const { team, body, getInvite, user } = await setup(
        invitedUser.email,
        "ADMINISTRATOR",
      )

      // add another user to the team as an author
      const secondInvitedUserMembership = await container
        .make(TeamMembershipRepository)
        .create({
          email: secondInvitedUser.email,
          userId: secondInvitedUser.id,
          status: "ACTIVE",
          teamId: team.id,
          expiresAt: new Date(),
          role: "AUTHOR",
        })

      const { token } = await getInvite()

      await makeRequestAsUser(invitedUser, {
        method: "PUT",
        path: `/memberships/${token}`,
        body,
      })

      const teamWithMembers = await container
        .make(TeamRepository)
        .findById(team.id)

      expect(teamWithMembers?.members).toHaveLength(2)

      // attempt to revoke access while being an author
      const response = await makeRequestAsUser(
        secondInvitedUser,
        {
          method: "DELETE",
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
})
