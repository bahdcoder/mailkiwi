import {
  AbTestsBroadcastsQueue,
  BroadcastsQueue,
} from '@/shared/queue/queue.js'
import { CheckProviderCredentials } from '@/teams/helpers/check_provider_credentials.js'
import { MailerRepository } from '@/teams/repositories/mailer_repository.js'
import { TeamRepository } from '@/teams/repositories/team_repository.js'
import { E_VALIDATION_FAILED } from '@/http/responses/errors.js'
import type { BroadcastWithoutContent } from '@/database/schema/types.js'
import { differenceInSeconds } from '@/utils/dates.js'
import { container } from '@/utils/typi.js'
import { SendBroadcastJob } from '@/broadcasts/jobs/send_broadcast_job.js'
import { BroadcastRepository } from '@/broadcasts/repositories/broadcast_repository.js'
import { SendAbTestBroadcastJob } from '../jobs/send_ab_test_broadcast_job.ts'

export class SendBroadcastAction {
  constructor(
    private broadcastRepository: BroadcastRepository = container.make(
      BroadcastRepository,
    ),
    private mailerRepository: MailerRepository = container.make(
      MailerRepository,
    ),
    private teamRepository: TeamRepository = container.make(TeamRepository),
  ) {}

  async handle(broadcast: BroadcastWithoutContent) {
    const team = await this.teamRepository.findById(broadcast.teamId)

    if (team?.mailer?.status !== 'READY')
      throw E_VALIDATION_FAILED([
        {
          message:
            'Cannot send a broadcast without configuring a valid mailer.',
        },
      ])

    const configurationIsValid = await new CheckProviderCredentials(
      this.mailerRepository.getDecryptedConfiguration(
        team.mailer.configuration,
        team.configurationKey,
      ),
      team.mailer,
    )
      .checkSendingEnabled()
      .execute()

    if (!configurationIsValid)
      throw E_VALIDATION_FAILED([
        {
          message:
            'Could not verify AWS access. Please make sure your provider configuration is valid.',
        },
      ])

    if (broadcast.isAbTest) {
      await AbTestsBroadcastsQueue.add(
        SendAbTestBroadcastJob.id,
        { broadcastId: broadcast.id },
        {
          delay: broadcast.sendAt
            ? differenceInSeconds(new Date(), broadcast.sendAt)
            : 0,
        },
      )
    }

    if (!broadcast.isAbTest) {
      await BroadcastsQueue.add(
        SendBroadcastJob.id,
        { broadcastId: broadcast.id },
        {
          delay: broadcast.sendAt
            ? differenceInSeconds(new Date(), broadcast.sendAt)
            : 0,
        },
      )
    }

    await this.broadcastRepository.update(broadcast.id, {
      status: 'QUEUED_FOR_SENDING',
    })
  }
}
