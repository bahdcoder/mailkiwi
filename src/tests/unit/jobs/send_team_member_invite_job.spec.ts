import { describe, test, vi } from "vitest"

import { SendTeamMemberInviteJob } from "@/teams/jobs/send_team_member_invite_job.js"

import { setup as teamMembershipSetup } from "@/tests/integration/teams/team_membership.spec.js"
import {
  refreshDatabase,
  refreshRedisDatabase,
} from "@/tests/mocks/teams/teams.js"

import { makeDatabase, makeRedis } from "@/shared/container/index.js"
import { Mailer } from "@/shared/mailers/mailer.js"

describe("Send team member invite", () => {
  test("sends an email with a unique hashed link for joining the team", async ({
    expect,
  }) => {
    await refreshDatabase()
    await refreshRedisDatabase()

    const database = makeDatabase()
    const redis = makeRedis()

    const { getInvite } = await teamMembershipSetup()

    const { invite } = await getInvite()

    const mockSendMail = vi
      .spyOn(Mailer.transport, "sendMail")
      .mockImplementation(async () => ({
        messageId: "",
        accepted: [],
        rejected: [],
        pending: [],
        response: "OK",
        envelope: {
          from: "",
          to: [],
        },
      }))

    Mailer.transport.sendMail = mockSendMail as any

    await new SendTeamMemberInviteJob().handle({
      database,
      redis,
      payload: { inviteId: invite?.id as number },
    })

    expect(mockSendMail).toHaveBeenCalledOnce()
  })
})
