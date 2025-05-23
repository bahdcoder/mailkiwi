import { appEnv } from '#root/core/app/env/app_env.js'

import { TeamMembershipRepository } from '#root/core/teams/repositories/team_membership_repository.js'

import { Mailer } from '#root/core/shared/mailers/mailer.js'
import { BaseJob, type JobContext } from '#root/core/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'
import { SignedUrlManager } from '#root/core/shared/utils/links/signed_url_manager.js'

import { container } from '#root/core/utils/typi.js'

export interface SendTeamMemberInviteJobPayload {
  inviteId: string
}

export class SendTeamMemberInviteJob extends BaseJob<SendTeamMemberInviteJobPayload> {
  static get id() {
    return 'ACCOUNTS::SEND_TEAM_MEMBER_INVITE'
  }

  static get queue() {
    return AVAILABLE_QUEUES.accounts
  }

  async handle({ payload }: JobContext<SendTeamMemberInviteJobPayload>) {
    const invite = await container
      .make(TeamMembershipRepository)
      .findById(payload.inviteId)

    if (!invite) {
      return this.done()
    }

    const token = new SignedUrlManager(appEnv.APP_KEY).encode(
      payload.inviteId.toString(),
      {},
    )

    await Mailer.from(appEnv.SMTP_MAIL_FROM)
      .to(invite.email)
      .subject("You've been invited to join a team on Kibamail.")
      .content(
        JSON.stringify({
          transactionalEmailId: 'transactionalEmailId',
          variables: {
            token,
          },
        }),
      )
      .send()

    return this.done()
  }

  async failed() {}
}
