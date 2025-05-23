import { SendingSourceRepository } from '#root/core/settings/repositories/sending_source_repository.js'

import { SendingDomainRepository } from '#root/core/sending_domains/repositories/sending_domain_repository.js'

import { SendingSource } from '#root/database/database_schema_types.js'

import { container } from '#root/core/utils/typi.js'

export class AssignSendingSourceToSendingDomainAction {
  constructor(
    private sendingSourceRepository = container.make(SendingSourceRepository),
    private sendingDomainRepository = container.make(SendingDomainRepository),
  ) {}
  async handle(sendingDomainId: string) {
    const sources =
      await this.sendingSourceRepository.findAllSendingSourcseWithSendingVolume()

    type Source = (typeof sources)[number]

    const sendPool: Source[] = sources
      .filter((source) => source.pool === 'engage')
      .sort((a, b) => b.emailSendsCount - a.emailSendsCount)

    const engagePool: Source[] = sources
      .filter((source) => source.pool === 'send')
      .sort((a, b) => b.emailSendsCount - a.emailSendsCount)

    await this.sendingDomainRepository.update(sendingDomainId, {
      sendingSourceId: sendPool?.[0]?.id,
      secondarySendingSourceId: sendPool?.[1]?.id,
      engageSendingSourceId: engagePool?.[0]?.id,
      engageSecSendingSourceId: engagePool?.[1]?.id,
    })
  }
}
