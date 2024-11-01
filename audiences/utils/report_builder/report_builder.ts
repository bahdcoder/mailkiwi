// to build a report, we need:
// 1. the audienceId
// 2. the broadcastId (optional) if no broadcast id is provided, generated report will for the entire audienceId
// 3. date ranges (start and end), without date range, would give results for all time events.
// 4. specify if comparisms are needed, for example, compare date range with previous part of date range. if last 7 days is passed, compare with the 7 days before that period.
// 5. aggregates (avg open rate, avg click rate, avg unsubscribe rate)
import { SQLWrapper, and, count, countDistinct, eq } from "drizzle-orm"
import { DateTime } from "luxon"

import { EmailSendEvent } from "@/database/database_schema_types.js"
import { emailSendEvents, emailSends } from "@/database/schema.js"

import { makeDatabase } from "@/shared/container/index.js"

export class ReportBuilder {
  protected configuration: {
    audienceId?: string
    broadcastId?: string
    to: string
    from: string
    comparePreviousRange?: boolean
  } = {
    from: DateTime.now().minus({ years: 100 }).toJSDate().toISOString(),
    to: DateTime.now().toJSDate().toISOString(),
    comparePreviousRange: false,
  }

  constructor(protected database = makeDatabase()) {}

  audience(audienceId: string) {
    this.configuration.audienceId = audienceId

    return this
  }

  comparePreviousRange() {
    this.configuration.comparePreviousRange = true

    return this
  }

  broadcast(broadcastId: string) {
    this.configuration.broadcastId = broadcastId

    return this
  }

  from(from: string) {
    this.configuration.from = from

    return this
  }

  to(to: string) {
    this.configuration.to = to

    return this
  }

  sendConditions() {
    const conditions: SQLWrapper[] = []

    if (this.configuration.audienceId) {
      conditions.push(
        eq(emailSends.audienceId, this.configuration.audienceId),
      )
    }

    if (this.configuration.broadcastId) {
      conditions.push(
        eq(emailSends.broadcastId, this.configuration.broadcastId),
      )
    }

    return and(...conditions)
  }

  conditions() {
    const conditions: SQLWrapper[] = []

    if (this.configuration.audienceId) {
      conditions.push(
        eq(emailSendEvents.audienceId, this.configuration.audienceId),
      )
    }

    if (this.configuration.broadcastId) {
      conditions.push(
        eq(emailSendEvents.broadcastId, this.configuration.broadcastId),
      )
    }

    return and(...conditions)
  }

  totalEventCount(event: EmailSendEvent["type"]) {
    return this.database
      .select({
        count: count(),
      })
      .from(emailSendEvents)
      .where(and(this.conditions(), eq(emailSendEvents.type, event)))
  }

  totalUniqueEventCount(event: EmailSendEvent["type"]) {
    return this.database
      .select({
        count: countDistinct(emailSendEvents.contactId),
      })
      .from(emailSendEvents)
      .where(and(this.conditions(), eq(emailSendEvents.type, event)))
  }

  totalSends() {
    return this.database
      .select({
        count: count(),
      })
      .from(emailSends)
      .where(and(this.sendConditions()))
  }

  async build() {
    // -> AVERAGES
    /*/
    /*/
    /*/
    /*/
    // average send rate
    // average click rate
    // average open rate
    // average unsubscribe rate
    // average bounce rate
    /*/
    /*/
    /*/
    /*/

    const [
      [{ count: sends }],
      [{ count: deliveries }],
      [{ count: opens }],
      [{ count: clicks }],
      [{ count: bounces }],
      [{ count: uniqueOpens }],
      [{ count: uniqueClicks }],
    ] = await Promise.all([
      this.totalSends(),
      this.totalEventCount("Delivery"),
      this.totalEventCount("Open"),
      this.totalEventCount("Click"),
      this.totalEventCount("Bounce"),
      this.totalUniqueEventCount("Open"),
      this.totalUniqueEventCount("Click"),
    ])

    return {
      sends,
      deliveries,
      opens,
      clicks,
      bounces,
      uniqueOpens,
      uniqueClicks,
    }
  }
}
