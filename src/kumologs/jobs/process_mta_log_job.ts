import { EmailSendEventRepository } from "@/email_sends/repositories/email_send_event_repository.js"
import { EmailSendRepository } from "@/email_sends/repositories/email_send_repository.js"
import { SendingSourceRepository } from "@/settings/repositories/sending_source_repository.js"

import { SendingDomainRepository } from "@/sending_domains/repositories/sending_domain_repository.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseJob, type JobContext } from "@/shared/queue/abstract_job.js"
import { AVAILABLE_QUEUES } from "@/shared/queue/config.js"
import { MtaLog } from "@/shared/types/mta.js"
import {
  fromEmailToDomain,
  ipv4AdressFromIpAndPort,
} from "@/shared/utils/string.js"

import { container } from "@/utils/typi.js"

export interface ProcessMtaLogJobPayload {
  log: MtaLog
}

export class ProcessMtaLogJob extends BaseJob<ProcessMtaLogJobPayload> {
  static get id() {
    return "MTA_LOGS::PROCESS_MTA_LOG"
  }

  static get queue() {
    return AVAILABLE_QUEUES.mta_logs
  }

  async handle({ payload: { log } }: JobContext<ProcessMtaLogJobPayload>) {
    const emailSendRepository = container.make(EmailSendRepository)

    if (!log.id) return this.done()

    const sendingDomain = await container
      .make(SendingDomainRepository)
      .findByDomain(fromEmailToDomain(log.sender))

    let sendingSourceId: string | undefined

    if (log.type === "Delivery") {
      const sendingSource = await container
        .make(SendingSourceRepository)
        .findByIpv4Address(
          ipv4AdressFromIpAndPort(log?.source_address?.address),
        )

      sendingSourceId = sendingSource?.id
    }

    const { id: emailSendId } = await emailSendRepository.upsert({
      sendingDomainId: sendingDomain.id,
      sendingId: log.id,
      recipient: log.recipient,
      receptionProtocl: log.reception_protocol,
      deliveryProtocol: log.delivery_protocol,
      nodeId: log.nodeid,
      sender: log.sender,
      siteName: log.site,
      queue: log.queue,
      size: log.size,
      egressPool: log.egress_pool,
      egressSource: log.egress_source,
      totalAttempts: log.num_attempts,
      sendingSourceId,
    })

    const logTypeHandler = container.make(LogTypeHandler)

    const handlers: Partial<
      Record<
        MtaLog["type"],
        (emailSendingId: string, log: MtaLog) => Promise<void>
      >
    > = {}

    const handler = handlers[log.type] ?? logTypeHandler.handleGenericEvent

    await handler?.(emailSendId, log)

    return this.done()
  }

  async failed() {}
}

export class LogTypeHandler {
  constructor(
    private database = makeDatabase(),
    private emailSendEventRepository = container.make(
      EmailSendEventRepository,
    ),
    private emailSendRepository = container.make(EmailSendRepository),
  ) {}

  async handleGenericEvent(emailSendId: string, log: MtaLog) {
    await this.emailSendEventRepository.create({
      type: log.type,
      emailSendId,
      responseCode: log.response.code,
      responseCommand: log.response.command,
      responseEnhancedCodeClass: log?.response?.enhanced_code?.class,
      responseEnhancedCodeDetail: log?.response?.enhanced_code?.detail,
      responseEnhancedCodeSubject: log?.response?.enhanced_code?.subject,
      responseContent: log.response.content,
      peerAddressAddr: log.peer_address?.addr,
      peerAddressName: log.peer_address?.name,
    })
  }
}
