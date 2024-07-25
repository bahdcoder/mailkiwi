import type { SendBroadcastDto } from '@/domains/broadcasts/dto/send_broadcast_dto.js'
import { BroadcastRepository } from '@/domains/broadcasts/repositories/broadcast_repository.js'
import { Queue } from '@/domains/shared/queue/queue.ts'
import { E_VALIDATION_FAILED } from '@/http/responses/errors.ts'
import type { Broadcast } from '@/infrastructure/database/schema/types.ts'
import { container } from '@/utils/typi.ts'
import { SendBroadcastJob } from '../jobs/send_broadcast_job.ts'
import { differenceInSeconds } from '@/utils/dates.ts'
import { TeamRepository } from '@/domains/teams/repositories/team_repository.ts'
import { CheckProviderCredentials } from '@/domains/teams/helpers/check_provider_credentials.ts'
import { MailerRepository } from '@/domains/teams/repositories/mailer_repository.ts'

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

  async handle(broadcast: Broadcast) {
    // return this.broadcastRepository.Send(id, dto)
    if (broadcast.status !== 'DRAFT')
      throw E_VALIDATION_FAILED([
        { message: 'Only a draft broadcast can be sent.', field: 'status' },
      ])

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

    await Queue.dispatch(
      SendBroadcastJob,
      { broadcastId: broadcast.id },
      {
        delay: broadcast.sendAt
          ? differenceInSeconds(new Date(), broadcast.sendAt)
          : 0,
      },
    )

    // await this.broadcastRepository.update(broadcast.id, {status: ''})
  }
}
