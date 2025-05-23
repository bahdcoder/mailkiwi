import { resolve } from 'node:path'
import { appEnv } from '#root/core/app/env/app_env.js'
import { EmailSendEventRepository } from '#root/core/email_sends/repositories/email_send_event_repository.js'
import { EmailSendRepository } from '#root/core/email_sends/repositories/email_send_repository.js'
import { SendingSourceRepository } from '#root/core/settings/repositories/sending_source_repository.js'
import { Reader as MaxMindReader } from '@maxmind/geoip2-node'
import { DateTime } from 'luxon'
import { UAParser } from 'ua-parser-js'

import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'

import { SendingDomainRepository } from '#root/core/sending_domains/repositories/sending_domain_repository.js'

import type { EmailSend, SendingDomain } from '#root/database/database_schema_types.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { BaseJob, type JobContext } from '#root/core/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'
import type { MtaLog } from '#root/core/shared/types/mta.js'
import { ipv4AdressFromIpAndPort } from '#root/core/shared/utils/string.js'

import { container } from '#root/core/utils/typi.js'

export interface ProcessMtaLogJobPayload {
  log: MtaLog
}

/**
 * ProcessMtaLogJob handles the asynchronous processing of Mail Transfer Agent (MTA) logs.
 *
 * This job is a critical component of Kibamail's email analytics infrastructure, responsible for:
 * 1. Processing various types of email events (delivery, opens, clicks, bounces)
 * 2. Updating email send records with delivery information
 * 3. Recording detailed event data for analytics and compliance
 * 4. Updating contact engagement metrics for marketing automation
 *
 * The job receives log events from multiple sources including the MTA itself (for delivery events),
 * the tracking controllers (for opens and clicks), and external feedback loops (for bounces and complaints).
 * It uses specialized handlers for different event types to ensure proper processing of each event.
 */
export class ProcessMtaLogJob extends BaseJob<ProcessMtaLogJobPayload> {
  static get id() {
    return 'MTA_LOGS::PROCESS_MTA_LOG'
  }

  static get queue() {
    return AVAILABLE_QUEUES.mta_logs
  }

  /**
   * Processes an MTA log event.
   *
   * This method implements the main log processing workflow:
   * 1. Retrieves the related email send and sending domain
   * 2. Creates a handler instance with the necessary context
   * 3. Selects the appropriate handler method based on event type
   * 4. Delegates to the handler to process the specific event
   *
   * The method uses a type-based dispatch pattern to route different event types
   * to specialized handlers, with a fallback to a generic handler for event types
   * that don't have specific handling logic.
   *
   * @param context - The job context containing the log event
   * @returns Job completion status
   */
  async handle({ payload: { log } }: JobContext<ProcessMtaLogJobPayload>) {
    const emailSendRepository = container.make(EmailSendRepository)

    // Retrieve the sending domain associated with the email
    const sendingDomain = await container
      .make(SendingDomainRepository)
      .findById(log.headers[appEnv.emailHeaders.sendingDomainId])

    // Retrieve the email send record
    const emailSend = await emailSendRepository.findById(
      log.headers[appEnv.emailHeaders.emailSendId],
    )

    // Validate that the email send exists
    if (!emailSend) {
      return this.fail('Invalid email send ID.')
    }

    // Create a handler instance with the necessary context
    const logTypeHandler = new LogTypeHandler(
      container.make(EmailSendEventRepository),
      sendingDomain,
      emailSend,
      log,
    )

    // Map event types to their specialized handlers
    const handlers: Partial<
      Record<MtaLog['type'], (emailSendingId: string, log: MtaLog) => Promise<void>>
    > = {
      Click: logTypeHandler.handleClickAndOpenEvent,
      Open: logTypeHandler.handleClickAndOpenEvent,
      Delivery: logTypeHandler.handleDeliveryEvent,
    }

    // Select the appropriate handler or fall back to the generic handler
    const handler = handlers[log.type] ?? logTypeHandler.handleGenericEvent

    // Process the event with the selected handler
    await handler?.(emailSend.id, log)

    return this.done()
  }

  async failed() {}
}

/**
 * LogTypeHandler processes different types of MTA (Mail Transfer Agent) logs and updates the system accordingly.
 *
 * This class is a critical component in Kibamail's email tracking and analytics infrastructure. It handles
 * various types of email events (delivery, opens, clicks) and updates both the email send records and contact
 * engagement metrics. The system uses this data for reporting, segmentation, and automation triggers.
 *
 * The handler differentiates between transactional emails ('send' product) and marketing emails ('engage' product)
 * and applies different business rules to each type. For marketing emails, contact engagement metrics are
 * updated to enable features like re-engagement campaigns and audience segmentation.
 */
export class LogTypeHandler {
  constructor(
    protected emailSendEventRepository: EmailSendEventRepository,
    protected sendingDomain: SendingDomain,
    protected emailSend: EmailSend,
    protected log: MtaLog,
  ) {}

  /**
   * Processes delivery confirmation logs from the MTA.
   *
   * When an email is successfully delivered to a recipient's mail server, this handler:
   * 1. Identifies which sending source (IP address) was used for delivery
   * 2. Updates the email send record with detailed delivery information
   * 3. Records the delivery event for analytics and compliance purposes
   *
   * This information is crucial for deliverability monitoring and troubleshooting
   * as it provides a complete record of how each email was processed by recipient servers.
   */
  handleDeliveryEvent = async () => {
    const log = this.log

    const sendingSource = await container
      .make(SendingSourceRepository)
      .findByIpv4Address(ipv4AdressFromIpAndPort(log?.source_address?.address))

    const sendingSourceId = sendingSource?.id

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

  /**
   * Processes click and open tracking events from email recipients.
   *
   * This complex handler is the cornerstone of Kibamail's engagement tracking system. When a recipient
   * opens an email or clicks a link, this handler:
   *
   * 1. Parses the user agent to identify browser and device information
   * 2. Uses MaxMind GeoIP database to determine the recipient's location
   * 3. Records the event with detailed metadata for analytics
   * 4. For marketing emails ('engage' product), updates the contact's engagement metrics
   *
   * The geographical and device data collected here enables advanced segmentation capabilities,
   * allowing customers to target contacts based on location or device preferences. This data
   * also feeds into automation workflows that can trigger based on engagement events.
   *
   * The system maintains different tracking for marketing vs. transactional emails to comply
   * with email marketing regulations and best practices.
   */
  handleClickAndOpenEvent = async () => {
    const log = this.log
    const parsedUserAgent = UAParser(log.user_agent)

    const maxMindDatabaseReader = await MaxMindReader.open(
      resolve(process.cwd(), 'geo', 'cities.mmdb'),
    )

    const city = maxMindDatabaseReader.city(log.ip_address)

    const isEngageProduct = log.headers?.[appEnv.emailHeaders.broadcastId]

    const database = makeDatabase()

    const contactRepository = container.make(ContactRepository)

    await database.transaction(async (trx) => {
      await this.emailSendEventRepository.transaction(trx).create({
        emailSendId: this.emailSend.id,
        type: log.type,

        createdAt: DateTime.fromSeconds(log.timestamp).toJSDate(),

        // device
        originBrowser: parsedUserAgent.browser.name,
        originDevice: parsedUserAgent.device.model,
        contactId: log?.headers?.[appEnv.emailHeaders.contactId],
        audienceId: log?.headers?.[appEnv.emailHeaders.audienceId],
        broadcastId: log?.headers?.[appEnv.emailHeaders.broadcastId],
        product: isEngageProduct ? 'engage' : 'send',
        // location
        originCity: city?.city?.names?.en,
        originCountry: city?.country?.isoCode,
        originState: city?.subdivisions?.[0]?.names?.en,
      })

      if (isEngageProduct) {
        const contactId = log?.headers?.[appEnv.emailHeaders.contactId]
        // trigger update to contact
        await contactRepository.transaction(trx).updateById(contactId, {
          ...(log.type === 'Click'
            ? {
                lastClickedBroadcastEmailLinkAt: DateTime.now().toJSDate(),
                lastTrackedActivityFrom: city?.country?.isoCode,
                lastTrackedActivityUsingDevice: parsedUserAgent.device.model,
                lastTrackedActivityUsingBrowser: parsedUserAgent.browser.name,
              }
            : {}),
          ...(log.type === 'Open'
            ? {
                lastOpenedBroadcastEmailAt: DateTime.now().toJSDate(),
                lastTrackedActivityFrom: city?.country?.isoCode,
                lastTrackedActivityUsingDevice: parsedUserAgent.device.model,
                lastTrackedActivityUsingBrowser: parsedUserAgent.browser.name,
              }
            : {}),
        })
      }
    })
  }

  /**
   * Processes all other types of MTA log events not specifically handled elsewhere.
   *
   * This catch-all handler records various email lifecycle events such as:
   * - Bounces (both hard and soft)
   * - Spam complaints
   * - Deferrals
   * - Rejections
   *
   * The detailed response codes and messages captured here are essential for:
   * 1. Deliverability management and troubleshooting
   * 2. Compliance with email sending best practices
   * 3. Automatic suppression of problematic addresses
   * 4. Reporting on overall email performance
   *
   * These events may trigger automated processes like removing hard-bounced addresses
   * from active audiences or pausing campaigns with high bounce rates.
   */
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
      contactId: log?.headers?.[appEnv.emailHeaders.contactId],
      audienceId: log?.headers?.[appEnv.emailHeaders.audienceId],
      broadcastId: log?.headers?.[appEnv.emailHeaders.broadcastId],
      product: 'engage',
    })
  }
}
