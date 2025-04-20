import { describe, test, vi } from 'vitest'

import { SendTeamMemberInviteJob } from '@/teams/jobs/send_team_member_invite_job.js'

import { makeDatabase, makeLogger, makeRedis } from '@/shared/container/index.js'
import { Mailer } from '@/shared/mailers/mailer.js'
import { setupTeamMemberships } from '@/tests/unit/helpers/teams/setup_team_membership.js'

describe('Send team member invite', () => {
  test('sends an email with a unique hashed link for joining the team', async ({
    expect,
  }) => {
    const database = makeDatabase()
    const redis = makeRedis()

    const { getInvite } = await setupTeamMemberships()

    const { invite } = await getInvite()

    const mockSendMail = vi
      .spyOn(Mailer.transport, 'sendMail')
      .mockImplementation(async () => ({
        messageId: '',
        accepted: [],
        rejected: [],
        pending: [],
        response: 'OK',
        envelope: {
          from: '',
          to: [],
        },
      }))

    // biome-ignore lint/suspicious/noExplicitAny: Test mock function
    Mailer.transport.sendMail = mockSendMail as any

    await new SendTeamMemberInviteJob().handle({
      database,
      redis,
      payload: { inviteId: invite?.id as string },
      logger: makeLogger(),
    })

    expect(mockSendMail).toHaveBeenCalledOnce()
  })
})
