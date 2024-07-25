import {
  BaseJob,
  type JobContext,
} from '@/domains/shared/queue/abstract_job.ts'
import { AVAILABLE_QUEUES } from '@/domains/shared/queue/config.ts'
import { GetMailerAction } from '@/domains/teams/actions/mailers/get_mailer_action.ts'
import { container } from '@/utils/typi.ts'
import { TeamRepository } from '@/domains/teams/repositories/team_repository.ts'
import { Queue } from '@/domains/shared/queue/queue.ts'

export interface VerifyMailerIdentityJobPayload {
  teamId: string
}

export class VerifyMailerIdentityJob extends BaseJob<VerifyMailerIdentityJobPayload> {
  static get id() {
    return 'ACCOUNTS::VERIFY_MAILER_IDENTITY'
  }

  static get queue() {
    return AVAILABLE_QUEUES.accounts
  }

  async handle(ctx: JobContext<VerifyMailerIdentityJobPayload>) {
    const team = await container
      .make(TeamRepository)
      .findById(ctx.payload.teamId)

    if (!team || !team?.mailer?.id) {
      return this.done()
    }

    if (!team) {
      return this.done()
    }

    const { identities } = await container.make(GetMailerAction).handle(team)

    const identity = identities[0]

    if (identity.status !== 'PENDING') {
      return this.done()
    }

    const payload = { teamId: team.id }

    await Queue.dispatch(
      VerifyMailerIdentityJob,
      payload,
      // Retry in 2.5 minutes
      { delay: 2.5 * 60 },
    )

    return { success: true, output: 'Success' }
  }
}
