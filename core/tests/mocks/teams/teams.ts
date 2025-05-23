import { faker } from '@faker-js/faker'
import { sql } from 'drizzle-orm'
import { createFakeEmailContent } from '../audiences/email_content.js'

import {
  type AutomationStepConfiguration,
  type ContactFilterCondition,
  accessTokens,
  audiences,
  automationSteps,
  automations,
  broadcasts,
  channelMemberships,
  channels,
  contactImports,
  contactProperties,
  contacts,
  emailContents,
  emailSendEvents,
  emailSends,
  emails,
  messageReactions,
  messages,
  oauth2Accounts,
  products,
  segments,
  sendingDomains,
  sendingSources,
  settings,
  tags,
  tagsOnContacts,
  teamMemberships,
  teams,
  users,
  websitePages,
  websites,
} from '#root/database/schema.js'
import type { AUTOMATION_STEP_SUB_TYPES_TRIGGER } from '#root/database/types/automations.js'

import { makeDatabase, makeRedis } from '#root/core/shared/container/index.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'

export const refreshRedisDatabase = async () => {
  const redis = makeRedis()

  await redis.flushall()
}

export const refreshDatabase = async () => {
  const database = makeDatabase()

  await database.execute(sql`SET FOREIGN_KEY_CHECKS=0;`)

  await database.delete(settings)
  await database.delete(emailSendEvents)
  await database.delete(emailSends)
  await database.delete(sendingDomains)
  await database.delete(sendingSources)
  await database.delete(tagsOnContacts)
  await database.delete(broadcasts)
  await database.delete(segments)
  await database.delete(websitePages)
  await database.delete(websites)
  await database.delete(contactProperties)
  await database.delete(contacts)
  await database.delete(contactImports)
  await database.delete(automationSteps)
  await database.delete(automations)
  await database.delete(tags)
  await database.delete(products)
  await database.delete(audiences)
  await database.delete(accessTokens)
  await database.delete(teamMemberships)
  await database.delete(messageReactions)
  await database.delete(messages)
  await database.delete(channelMemberships)
  await database.delete(channels)
  await database.delete(teams)
  await database.delete(oauth2Accounts)
  await database.delete(users)

  await database.execute(sql`SET FOREIGN_KEY_CHECKS=1;`)
}

export const seedAutomation = async (
  automation: {
    audienceId: string
    name?: string
    description?: string
    triggerConditions?: ContactFilterCondition[]
    trigger?: AUTOMATION_STEP_SUB_TYPES_TRIGGER
    triggerConfiguration?: AutomationStepConfiguration
    senderIdentityId?: string
  },
  createSteps = true,
) => {
  const database = makeDatabase()

  const automationId = cuid()

  await database.insert(automations).values({
    id: automationId,
    name: automation.name ?? 'Book launch',
    audienceId: automation.audienceId,
    description: automation.description ?? 'Book launch',
  })

  if (!createSteps) {
    return { id: automationId }
  }

  const emailContentId = cuid()

  await database
    .insert(emailContents)
    .values({ ...createFakeEmailContent(), id: emailContentId })

  const emailId = cuid()

  await database.insert(emails).values({
    id: emailId,
    title: faker.lorem.words(2),
    type: 'AUTOMATION',
    audienceId: automation.audienceId,
    emailContentId,
    senderIdentityId: automation.senderIdentityId,
  })

  // Now create sample data for a automation that looks like this:

  const startingTriggerAutomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: startingTriggerAutomationStepId,
      automationId,
      type: 'TRIGGER',
      status: 'ACTIVE',
      subtype: automation?.trigger ?? 'TRIGGER_CONTACT_SUBSCRIBED',
      configuration: automation?.triggerConfiguration ?? {
        filterGroups: {
          type: 'AND',
          groups: [
            {
              type: 'AND',
              conditions: automation.triggerConditions ?? [],
            },
          ],
        },
      },
    })
    .execute()

  const receiveWelcomeEmailautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: receiveWelcomeEmailautomationStepId,
      automationId,
      parentId: startingTriggerAutomationStepId,
      type: 'ACTION',
      subtype: 'ACTION_SEND_EMAIL',
      configuration: { emailId },
    })
    .execute()

  const attachTagIds = [cuid(), cuid()]

  for (const [idx] of attachTagIds.entries()) {
    await database
      .insert(tags)
      .values({
        id: attachTagIds[idx],
        name: faker.lorem.words(2),
        audienceId: automation.audienceId,
      })
      .execute()
  }

  const attachesTagsAutomationStepId = cuid()
  await database
    .insert(automationSteps)
    .values({
      id: attachesTagsAutomationStepId,
      automationId,
      parentId: receiveWelcomeEmailautomationStepId,
      type: 'ACTION',
      subtype: 'ACTION_ADD_TAG',
      configuration: { tagIds: attachTagIds },
    })
    .execute()

  const waitsTwoDaysAutomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: waitsTwoDaysAutomationStepId,
      automationId,
      parentId: attachesTagsAutomationStepId,
      type: 'RULE',
      subtype: 'RULE_WAIT_FOR_DURATION',
      configuration: { delay: 2880 },
    })
    .execute()

  const detachTagIds = [cuid(), cuid()]

  for (const [idx] of detachTagIds.entries()) {
    await database
      .insert(tags)
      .values({
        id: detachTagIds[idx],
        name: faker.lorem.words(2),
        audienceId: automation.audienceId,
      })
      .execute()
  }

  const detachesTagsAutomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: detachesTagsAutomationStepId,
      automationId,
      parentId: waitsTwoDaysAutomationStepId,
      type: 'ACTION',
      subtype: 'ACTION_REMOVE_TAG',
      configuration: { tagIds: detachTagIds },
    })
    .execute()

  const receiveSecondEmailEmailautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: receiveSecondEmailEmailautomationStepId,
      automationId,
      parentId: detachesTagsAutomationStepId,
      type: 'ACTION',
      subtype: 'ACTION_SEND_EMAIL',
      configuration: { emailId },
    })
    .execute()

  const waitsOneDayAutomationStepId = cuid()
  await database
    .insert(automationSteps)
    .values({
      id: waitsOneDayAutomationStepId,
      automationId,
      parentId: receiveSecondEmailEmailautomationStepId,
      type: 'RULE',
      subtype: 'RULE_WAIT_FOR_DURATION',
      configuration: { delay: 1440 }, // delay is in minutes
    })
    .execute()

  const ifElseBranchautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: ifElseBranchautomationStepId,
      automationId,
      parentId: waitsOneDayAutomationStepId,
      type: 'RULE',
      subtype: 'RULE_IF_ELSE',
      configuration: {
        filterGroups: {
          type: 'AND',
          groups: [
            {
              type: 'AND',
              conditions: [
                {
                  field: 'tags',
                  operation: 'contains',
                  value: ['gjdbbgfyz6e9m3tk99ezp084'],
                },
              ],
            },
          ],
        },
      },
    })
    .execute()

  const hasTagReceivesThankYouautomationStepId = cuid()
  await database
    .insert(automationSteps)
    .values({
      id: hasTagReceivesThankYouautomationStepId,
      automationId,
      parentId: ifElseBranchautomationStepId,
      type: 'ACTION',
      subtype: 'ACTION_SEND_EMAIL',
      configuration: {
        emailId,
      },
      branchIndex: 0,
    })
    .execute()

  const hasTagWait4DaysautomationStepId = cuid()
  await database
    .insert(automationSteps)
    .values({
      id: hasTagWait4DaysautomationStepId,
      automationId,
      parentId: hasTagReceivesThankYouautomationStepId,
      type: 'RULE',
      subtype: 'RULE_WAIT_FOR_DURATION',
      configuration: { delay: 5760 },
    })
    .execute()

  const hasTagAddToAudienceautomationId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: hasTagAddToAudienceautomationId,
      automationId,
      parentId: hasTagWait4DaysautomationStepId,
      type: 'ACTION',
      subtype: 'ACTION_SUBSCRIBE_TO_AUDIENCE',
      configuration: {
        audienceId: cuid(),
      },
    })
    .execute()

  const hasTagWait1DayautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: hasTagWait1DayautomationStepId,
      automationId,
      parentId: hasTagAddToAudienceautomationId,
      type: 'RULE',
      subtype: 'RULE_WAIT_FOR_DURATION',
      configuration: { delay: 1440 },
    })
    .execute()

  const hasTagSendDiscountautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: hasTagSendDiscountautomationStepId,
      automationId,
      parentId: hasTagWait1DayautomationStepId,
      type: 'ACTION',
      subtype: 'ACTION_SEND_EMAIL',
      configuration: { emailId },
    })
    .execute()

  const hasTagEndautomationStepId = cuid()
  await database
    .insert(automationSteps)
    .values({
      id: hasTagEndautomationStepId,
      automationId,
      parentId: hasTagSendDiscountautomationStepId,
      type: 'END',
      subtype: 'END',
      configuration: {},
    })
    .execute()

  const notHasTagReceives80PercentDiscountEmailautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: notHasTagReceives80PercentDiscountEmailautomationStepId,
      automationId,
      parentId: ifElseBranchautomationStepId,
      type: 'ACTION',
      subtype: 'ACTION_SEND_EMAIL',
      configuration: {
        emailId,
      },
      branchIndex: 1,
    })
    .execute()

  const notHasTagWait3DaysautomationStepId = cuid()
  await database
    .insert(automationSteps)
    .values({
      id: notHasTagWait3DaysautomationStepId,
      automationId,
      parentId: notHasTagReceives80PercentDiscountEmailautomationStepId,
      type: 'RULE',
      subtype: 'RULE_WAIT_FOR_DURATION',
      configuration: {
        emailId,
      },
      branchIndex: 1,
    })
    .execute()

  const secondIfElseBranchautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: secondIfElseBranchautomationStepId,
      automationId,
      parentId: notHasTagWait3DaysautomationStepId,
      type: 'RULE',
      subtype: 'RULE_IF_ELSE',
      configuration: {
        filterGroups: {
          type: 'AND',
          groups: [
            {
              type: 'AND',
              conditions: [
                {
                  field: 'email',
                  operation: 'endsWith',
                  value: ['@gmail.com'],
                },
              ],
            },
          ],
        },
      },
    })
    .execute()

  const isGmailautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: isGmailautomationStepId,
      automationId,
      parentId: secondIfElseBranchautomationStepId,
      type: 'ACTION',
      subtype: 'ACTION_UNSUBSCRIBE_FROM_AUDIENCE',
      configuration: {},
      branchIndex: 0,
    })
    .execute()

  const isNotGmailGetDiscountautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: isNotGmailGetDiscountautomationStepId,
      automationId,
      parentId: secondIfElseBranchautomationStepId,
      type: 'ACTION',
      subtype: 'ACTION_SEND_EMAIL',
      configuration: {
        emailId,
      },
      branchIndex: 1,
    })
    .execute()

  const isNotGmailWait5DaysautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: isNotGmailWait5DaysautomationStepId,
      automationId,
      parentId: isNotGmailGetDiscountautomationStepId,
      type: 'RULE',
      subtype: 'RULE_WAIT_FOR_DURATION',
      configuration: {},
      branchIndex: 1,
    })
    .execute()

  const thirdIfElseBranchautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: thirdIfElseBranchautomationStepId,
      automationId,
      parentId: isNotGmailWait5DaysautomationStepId,
      type: 'RULE',
      subtype: 'RULE_IF_ELSE',
      configuration: {
        filterGroups: {
          type: 'AND',
          groups: [
            {
              type: 'AND',
              conditions: [
                {
                  field: 'tags',
                  operation: 'contains',
                  value: [0],
                },
              ],
            },
          ],
        },
      },
    })
    .execute()

  const purchasedBookautomationStepId = cuid()
  await database
    .insert(automationSteps)
    .values({
      id: purchasedBookautomationStepId,
      automationId,
      parentId: thirdIfElseBranchautomationStepId,
      type: 'ACTION',
      subtype: 'ACTION_SUBSCRIBE_TO_AUDIENCE',
      configuration: {
        audienceId: cuid(),
      },
      branchIndex: 0,
    })
    .execute()

  const notPurchasedBookautomationStepId = cuid()
  await database
    .insert(automationSteps)
    .values({
      id: notPurchasedBookautomationStepId,
      automationId,
      parentId: thirdIfElseBranchautomationStepId,
      type: 'ACTION',
      subtype: 'ACTION_UNSUBSCRIBE_FROM_AUDIENCE',
      configuration: {
        audienceId: cuid(),
      },
      branchIndex: 1,
    })
    .execute()

  // Starting point: User subscribes to email list ✅
  // Next automation point: Receives a welcome email ✅
  // Next automation point: Waits 2 days ✅
  // Next automation point: Receives a second email about my book ✅
  // Next automation point: Waits 1 day ✅
  // Next automation point: A branch, if / else statement checking if the contact has a tag "purchased-book" or not ✅
  // automation for If has tag purchased book, automation is:
  // 1. Receives thank you email for purchasing ✅
  // 2. wait 4 days. ✅
  // 3. Add user to new email list "Purchasers" ✅
  // 4. Wait 1 day ✅
  // 5. Send discount for purchasing online course ✅
  // 6. End automation. ✅

  // automation for if contact does not have the "purchased-book" tag:

  // 1. Receives email with an 80% discount ✅
  // 2. wait 3 days ✅
  // 3. automation splits again with if / else statement, checking if contact has email ending with "@gmail.com". ✅

  // If email ends with "@gmail.com", contact should get removed from the email list. End automation.

  // If not ends with "@gmail.com", contact should:

  // 1. Receive another email with 90% discount ✅
  // 2. wait 5 days ✅
  // 3. Check if contact has "purchased-book" tag. If yes, add them to list "Purchasers". End automation. If no, remove them from email list. End automation. ✅

  // Provide sample api responses for each of the endpoints related to automations . all automation points must be their own database rows to allow for full flexibility to allow for features like drag and drop and reordering of automation points

  return {
    id: automationId,
    automationId,
    receiveWelcomeEmailautomationStepId,
    hasTagAddToAudienceautomationId,
    attachesTagsAutomationStepId,
    emailId,
    attachTagIds,
    detachTagIds,
    detachesTagsAutomationStepId,
    startingTriggerAutomationStepId,
  }
}
