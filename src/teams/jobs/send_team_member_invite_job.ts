import { type SQLWrapper, and, eq } from "drizzle-orm"
import { vi } from "vitest"

import type { CreateSegmentDto } from "@/audiences/dto/segments/create_segment_dto.ts"
import { SegmentBuilder } from "@/audiences/utils/segment_builder/segment_builder.ts"

import { TeamMembershipRepository } from "@/teams/repositories/team_membership_repository.ts"

import { broadcasts, contacts } from "@/database/schema/schema.js"

import { makeEnv } from "@/shared/container/index.ts"
import { Mailer } from "@/shared/mailers/mailer.ts"
import { BaseJob, type JobContext } from "@/shared/queue/abstract_job.js"
import { AVAILABLE_QUEUES } from "@/shared/queue/config.js"
import { Queue } from "@/shared/queue/queue.js"
import { SignedUrlManager } from "@/shared/utils/links/signed_url_manager.ts"

import { container } from "@/utils/typi.ts"

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
    const env = makeEnv()

    const invite = await container
      .make(TeamMembershipRepository)
      .findById(payload.inviteId)

    if (!invite) {
      // maybe invite was deleted by user immediately after. just ignore.
      return this.done()
    }

    const token = container
      .make(SignedUrlManager)
      .encode(payload.inviteId, {})

    await Mailer.from(env.SMTP_MAIL_FROM)
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
