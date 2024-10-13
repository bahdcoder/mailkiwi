import { apiEnv } from "@/api/env/api_env.js"
import { EmailSendEventRepository } from "@/email_sends/repositories/email_send_event_repository.js"
import { EmailSendRepository } from "@/email_sends/repositories/email_send_repository.js"
import { SendingSourceRepository } from "@/settings/repositories/sending_source_repository.js"
import { Reader as MaxMindReader } from "@maxmind/geoip2-node"
import { DateTime } from "luxon"
import { resolve } from "path"
import { UAParser } from "ua-parser-js"

import { SendingDomainRepository } from "@/sending_domains/repositories/sending_domain_repository.js"

import {
  EmailSend,
  SendingDomain,
} from "@/database/schema/database_schema_types.js"

import { BaseJob, type JobContext } from "@/shared/queue/abstract_job.js"
import { AVAILABLE_QUEUES } from "@/shared/queue/config.js"
import { MtaLog } from "@/shared/types/mta.js"
import { ipv4AdressFromIpAndPort } from "@/shared/utils/string.js"

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

    const sendingDomain = await container
      .make(SendingDomainRepository)
      .findById(log.headers[apiEnv.emailHeaders.sendingDomainId])

    const emailSend = await emailSendRepository.findById(
      log.headers[apiEnv.emailHeaders.emailSendId],
    )

    if (!emailSend) {
      return this.fail("Invalid email send ID.")
    }

    const logTypeHandler = new LogTypeHandler(
      container.make(EmailSendEventRepository),
      sendingDomain,
      emailSend,
      log,
    )

    const handlers: Partial<
      Record<
        MtaLog["type"],
        (emailSendingId: string, log: MtaLog) => Promise<void>
      >
    > = {
      Click: logTypeHandler.handleClickAndOpenEvent,
      Open: logTypeHandler.handleClickAndOpenEvent,
      Delivery: logTypeHandler.handleDeliveryEvent,
    }

    const handler = handlers[log.type] ?? logTypeHandler.handleGenericEvent

    await handler?.(emailSend.id, log)

    return this.done()
  }

  async failed() {}
}

export class LogTypeHandler {
  constructor(
    protected emailSendEventRepository = container.make(
      EmailSendEventRepository,
    ),
    protected sendingDomain: SendingDomain,
    protected emailSend: EmailSend,
    protected log: MtaLog,
  ) {}

  handleDeliveryEvent = async () => {
    const log = this.log

    let sendingSourceId: string | undefined

    const sendingSource = await container
      .make(SendingSourceRepository)
      .findByIpv4Address(
        ipv4AdressFromIpAndPort(log?.source_address?.address),
      )

    sendingSourceId = sendingSource?.id

    await container.make(EmailSendRepository).update(this.emailSend.id, {
      sendingDomainId: this.sendingDomain.id,
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

    await this.handleGenericEvent()
  }

  handleClickAndOpenEvent = async () => {
    const log = this.log
    const parsedUserAgent = UAParser(log.user_agent)

    const maxMindDatabaseReader = await MaxMindReader.open(
      resolve(process.cwd(), "geo", "cities.mmdb"),
    )

    const city = maxMindDatabaseReader.city(log.ip_address)

    await this.emailSendEventRepository.create({
      emailSendId: this.emailSend.id,
      type: log.type,

      createdAt: DateTime.fromSeconds(log.timestamp).toJSDate(),

      // device
      originBrowser: parsedUserAgent.browser.name,
      originDevice: parsedUserAgent.device.model,

      // location
      originCity: city?.city?.names?.en,
      originCountry: city?.country?.isoCode,
      originState: city?.subdivisions?.[0]?.names?.en,
    })
  }

  handleGenericEvent = async () => {
    const log = this.log

    await this.emailSendEventRepository.create({
      type: log.type,
      emailSendId: this.emailSend.id,
      createdAt: DateTime.fromSeconds(log.timestamp).toJSDate(),
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
