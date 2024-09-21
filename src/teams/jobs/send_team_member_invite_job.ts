import { apiEnv } from "@/api/env/api_env.js"

import { TeamMembershipRepository } from "@/teams/repositories/team_membership_repository.js"

import { Mailer } from "@/shared/mailers/mailer.js"
import { BaseJob, type JobContext } from "@/shared/queue/abstract_job.js"
import { AVAILABLE_QUEUES } from "@/shared/queue/config.js"
import { SignedUrlManager } from "@/shared/utils/links/signed_url_manager.js"

import { container } from "@/utils/typi.js"

export interface SendTeamMemberInviteJobPayload {
  inviteId: string
}

export class SendTeamMemberInviteJob extends BaseJob<SendTeamMemberInviteJobPayload> {
  static get id() {
    return "ACCOUNTS::SEND_TEAM_MEMBER_INVITE"
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

    const token = new SignedUrlManager(apiEnv.APP_KEY).encode(
      payload.inviteId.toString(),
      {},
    )

    await Mailer.from(apiEnv.SMTP_MAIL_FROM)
      .to(invite.email)
      .subject("You've been invited to join a team on Kibamail.")
      .content(
        JSON.stringify({
          transactionalEmailId: "transactionalEmailId",
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
