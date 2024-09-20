import { createFakeEmailContent } from "../audiences/email_content.js"
import { faker } from "@faker-js/faker"

import {
  type ContactFilterCondition,
  accessTokens,
  audiences,
  automationSteps,
  automations,
  broadcasts,
  contactImports,
  contacts,
  emailContents,
  emails,
  segments,
  sendingDomains,
  tags,
  tagsOnContacts,
  teamMemberships,
  teams,
  users,
} from "@/database/schema/schema.js"

import { makeDatabase, makeRedis } from "@/shared/container/index.js"
import { fromQueryResultToPrimaryKey } from "@/shared/utils/database/primary_keys.js"

export const refreshRedisDatabase = async () => {
  const redis = makeRedis()

  await redis.flushall()
}

export const refreshDatabase = async () => {
  const database = makeDatabase()

  await database.delete(sendingDomains)
  await database.delete(tagsOnContacts)
  await database.delete(broadcasts)
  await database.delete(segments)
  await database.delete(contactImports)
  await database.delete(contacts)
  await database.delete(automationSteps)
  await database.delete(automations)
  await database.delete(tags)
  await database.delete(audiences)
  await database.delete(accessTokens)
  await database.delete(teamMemberships)
  await database.delete(teams)
  await database.delete(users)
}

export const seedAutomation = async (
  automation: {
    audienceId: number
    name?: string
    description?: string
    triggerConditions?: ContactFilterCondition[]
  },
  createSteps = true,
) => {
  const database = makeDatabase()

  const insertAutomationResult = await database
    .insert(automations)
    .values({
      name: automation.name ?? "Book launch",
      audienceId: automation.audienceId,
      description: automation.description ?? "Book launch",
    })

  const automationId = fromQueryResultToPrimaryKey(insertAutomationResult)

  if (!createSteps) {
    return { id: automationId }
  }

  const insertEmailContentResult = await database
    .insert(emailContents)
    .values(createFakeEmailContent())

  const emailContentId = insertEmailContentResult?.[0]?.insertId

  const insertAutomationEmailResult = await database
    .insert(emails)
    .values({
      title: faker.lorem.words(2),
      type: "AUTOMATION",
      audienceId: automation.audienceId,
      emailContentId,
    })

  const emailId = fromQueryResultToPrimaryKey(insertAutomationEmailResult)

  // Now create sample data for a automation that looks like this:

  const startingTriggerAutomationStepResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      type: "TRIGGER",
      subtype: "TRIGGER_CONTACT_SUBSCRIBED",
      configuration: {
        filterGroups: {
          type: "AND",
          groups: [
            {
              type: "AND",
              conditions: automation.triggerConditions ?? [],
            },
          ],
        },
      },
    })
    .execute()

  const startingTriggerAutomationStepId =
    startingTriggerAutomationStepResult?.[0]?.insertId

  const receiveWelcomeEmailautomationStepResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      parentId: startingTriggerAutomationStepId,
      type: "ACTION",
      subtype: "ACTION_SEND_EMAIL",
      configuration: { emailId },
    })
    .execute()

  const receiveWelcomeEmailautomationStepId = fromQueryResultToPrimaryKey(
    receiveWelcomeEmailautomationStepResult,
  )

  let attachTagIds = [0, 0]

  for (const [idx] of attachTagIds.entries()) {
    const insertTagsResult = await database
      .insert(tags)
      .values({
        name: faker.lorem.words(2),
        audienceId: automation.audienceId,
      })
      .execute()

    attachTagIds[idx] = fromQueryResultToPrimaryKey(insertTagsResult)
  }

  const attachesTagsAutomationStepResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      parentId: receiveWelcomeEmailautomationStepId,
      type: "ACTION",
      subtype: "ACTION_ADD_TAG",
      configuration: { tagIds: attachTagIds },
    })
    .execute()

  const attachesTagsAutomationStepId = fromQueryResultToPrimaryKey(
    attachesTagsAutomationStepResult,
  )

  const waitsTwoDaysAutomationStepResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      parentId: attachesTagsAutomationStepId,
      type: "RULE",
      subtype: "RULE_WAIT_FOR_DURATION",
      configuration: { delay: 2880 },
    })
    .execute()

  const waitsTwoDaysAutomationStepId = fromQueryResultToPrimaryKey(
    waitsTwoDaysAutomationStepResult,
  )

  let detachTagIds = [0, 0]

  for (const [idx] of detachTagIds.entries()) {
    const insertResult = await database
      .insert(tags)
      .values({
        name: faker.lorem.words(2),
        audienceId: automation.audienceId,
      })
      .execute()

    detachTagIds[idx] = fromQueryResultToPrimaryKey(insertResult)
  }

  const detachesTagsAutomationStepResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      parentId: waitsTwoDaysAutomationStepId,
      type: "ACTION",
      subtype: "ACTION_REMOVE_TAG",
      configuration: { tagIds: detachTagIds },
    })
    .execute()

  const detachesTagsAutomationStepId = fromQueryResultToPrimaryKey(
    detachesTagsAutomationStepResult,
  )

  const receiveSecondEmailEmailautomationStepResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      parentId: detachesTagsAutomationStepId,
      type: "ACTION",
      subtype: "ACTION_SEND_EMAIL",
      configuration: { emailId },
    })
    .execute()

  const receiveSecondEmailEmailautomationStepId =
    receiveSecondEmailEmailautomationStepResult?.[0]?.insertId

  const waitsOneDayAutomationStepResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      parentId: receiveSecondEmailEmailautomationStepId,
      type: "RULE",
      subtype: "RULE_WAIT_FOR_DURATION",
      configuration: { delay: 1440 }, // delay is in minutes
    })
    .execute()
  const waitsOneDayAutomationStepId = fromQueryResultToPrimaryKey(
    waitsOneDayAutomationStepResult,
  )

  const ifElseBranchautomationStepResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      parentId: waitsOneDayAutomationStepId,
      type: "RULE",
      subtype: "RULE_IF_ELSE",
      configuration: {
        filterGroups: {
          type: "AND",
          groups: [
            {
              type: "AND",
              conditions: [
                {
                  field: "tags",
                  operation: "contains",
                  value: ["gjdbbgfyz6e9m3tk99ezp084"],
                },
              ],
            },
          ],
        },
      },
    })
    .execute()
  const ifElseBranchautomationStepId = fromQueryResultToPrimaryKey(
    ifElseBranchautomationStepResult,
  )

  const hasTagReceivesThankYouautomationStepResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      parentId: ifElseBranchautomationStepId,
      type: "ACTION",
      subtype: "ACTION_SEND_EMAIL",
      configuration: {
        emailId,
      },
      branchIndex: 0,
    })
    .execute()
  const hasTagReceivesThankYouautomationStepId =
    fromQueryResultToPrimaryKey(hasTagReceivesThankYouautomationStepResult)

  const hasTagWait4DaysautomationStepResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      parentId: hasTagReceivesThankYouautomationStepId,
      type: "RULE",
      subtype: "RULE_WAIT_FOR_DURATION",
      configuration: { delay: 5760 },
    })
    .execute()

  const hasTagWait4DaysautomationStepId = fromQueryResultToPrimaryKey(
    hasTagWait4DaysautomationStepResult,
  )

  const hasTagAddToAudienceautomationResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      parentId: hasTagWait4DaysautomationStepId,
      type: "ACTION",
      subtype: "ACTION_SUBSCRIBE_TO_AUDIENCE",
      configuration: {
        audienceId: 0,
      },
    })
    .execute()
  const hasTagAddToAudienceautomationId = fromQueryResultToPrimaryKey(
    hasTagAddToAudienceautomationResult,
  )

  const hasTagWait1DayautomationStepResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      parentId: hasTagAddToAudienceautomationId,
      type: "RULE",
      subtype: "RULE_WAIT_FOR_DURATION",
      configuration: { delay: 1440 },
    })
    .execute()
  const hasTagWait1DayautomationStepId = fromQueryResultToPrimaryKey(
    hasTagWait1DayautomationStepResult,
  )

  const hasTagSendDiscountautomationStepResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      parentId: hasTagWait1DayautomationStepId,
      type: "ACTION",
      subtype: "ACTION_SEND_EMAIL",
      configuration: { emailId },
    })
    .execute()
  const hasTagSendDiscountautomationStepId = fromQueryResultToPrimaryKey(
    hasTagSendDiscountautomationStepResult,
  )

  const hasTagEndautomationStepResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      parentId: hasTagSendDiscountautomationStepId,
      type: "END",
      subtype: "END",
      configuration: { type: "END" },
    })
    .execute()

  const hasTagEndautomationStepId = fromQueryResultToPrimaryKey(
    hasTagEndautomationStepResult,
  )

  const notHasTagReceives80PercentDiscountEmailautomationStepResult =
    await database
      .insert(automationSteps)
      .values({
        automationId,
        parentId: ifElseBranchautomationStepId,
        type: "ACTION",
        subtype: "ACTION_SEND_EMAIL",
        configuration: {
          emailId,
        },
        branchIndex: 1,
      })
      .execute()
  const notHasTagReceives80PercentDiscountEmailautomationStepId =
    fromQueryResultToPrimaryKey(
      notHasTagReceives80PercentDiscountEmailautomationStepResult,
    )

  const notHasTagWait3DaysautomationStepResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      parentId: notHasTagReceives80PercentDiscountEmailautomationStepId,
      type: "RULE",
      subtype: "RULE_WAIT_FOR_DURATION",
      configuration: {
        emailId,
      },
      branchIndex: 1,
    })
    .execute()

  const notHasTagWait3DaysautomationStepId = fromQueryResultToPrimaryKey(
    notHasTagWait3DaysautomationStepResult,
  )

  const secondIfElseBranchautomationStepResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      parentId: notHasTagWait3DaysautomationStepId,
      type: "RULE",
      subtype: "RULE_IF_ELSE",
      configuration: {
        filterGroups: {
          type: "AND",
          groups: [
            {
              type: "AND",
              conditions: [
                {
                  field: "email",
                  operation: "endsWith",
                  value: ["@gmail.com"],
                },
              ],
            },
          ],
        },
      },
    })
    .execute()

  const secondIfElseBranchautomationStepId = fromQueryResultToPrimaryKey(
    secondIfElseBranchautomationStepResult,
  )

  const isGmailautomationStepResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      parentId: secondIfElseBranchautomationStepId,
      type: "ACTION",
      subtype: "ACTION_UNSUBSCRIBE_FROM_AUDIENCE",
      configuration: { type: "END" },
      branchIndex: 0,
    })
    .execute()

  const isGmailautomationStepId = fromQueryResultToPrimaryKey(
    isGmailautomationStepResult,
  )

  const isNotGmailGetDiscountautomationStepResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      parentId: secondIfElseBranchautomationStepId,
      type: "ACTION",
      subtype: "ACTION_SEND_EMAIL",
      configuration: {
        emailId,
      },
      branchIndex: 1,
    })
    .execute()

  const isNotGmailGetDiscountautomationStepId =
    fromQueryResultToPrimaryKey(isNotGmailGetDiscountautomationStepResult)

  const isNotGmailWait5DaysautomationStepResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      parentId: isNotGmailGetDiscountautomationStepId,
      type: "RULE",
      subtype: "RULE_WAIT_FOR_DURATION",
      configuration: { type: "END" },
      branchIndex: 1,
    })
    .execute()
  const isNotGmailWait5DaysautomationStepId = fromQueryResultToPrimaryKey(
    isNotGmailWait5DaysautomationStepResult,
  )

  const thirdIfElseBranchautomationStepResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      parentId: isNotGmailWait5DaysautomationStepId,
      type: "RULE",
      subtype: "RULE_IF_ELSE",
      configuration: {
        filterGroups: {
          type: "AND",
          groups: [
            {
              type: "AND",
              conditions: [
                {
                  field: "tags",
                  operation: "contains",
                  value: [0],
                },
              ],
            },
          ],
        },
      },
    })
    .execute()
  const thirdIfElseBranchautomationStepId = fromQueryResultToPrimaryKey(
    thirdIfElseBranchautomationStepResult,
  )

  const purchasedBookautomationStepResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      parentId: thirdIfElseBranchautomationStepId,
      type: "ACTION",
      subtype: "ACTION_SUBSCRIBE_TO_AUDIENCE",
      configuration: {
        audienceId: 0,
      },
      branchIndex: 0,
    })
    .execute()

  const notPurchasedBookautomationStepResult = await database
    .insert(automationSteps)
    .values({
      automationId,
      parentId: thirdIfElseBranchautomationStepId,
      type: "ACTION",
      subtype: "ACTION_UNSUBSCRIBE_FROM_AUDIENCE",
      configuration: {
        audienceId: 0,
      },
      branchIndex: 1,
    })
    .execute()

  const notPurchasedBookautomationStepId = fromQueryResultToPrimaryKey(
    notPurchasedBookautomationStepResult,
  )

  // Starting point: User subscribes to email list ✅
  // Next automation point: Receives a welcome email ✅
  // Next automation point: Waits 2 days ✅
  // Next automation point: Receives a second email about my book ✅
  // Next automation point: Waits 1 day ✅
  // Next automation point: A branch, if / else statement checking if the subscriber has a tag "purchased-book" or not ✅
  // automation for If has tag purchased book, automation is:
  // 1. Receives thank you email for purchasing ✅
  // 2. wait 4 days. ✅
  // 3. Add user to new email list "Purchasers" ✅
  // 4. Wait 1 day ✅
  // 5. Send discount for purchasing online course ✅
  // 6. End automation. ✅

  // automation for if subscriber does not have the "purchased-book" tag:

  // 1. Receives email with an 80% discount ✅
  // 2. wait 3 days ✅
  // 3. automation splits again with if / else statement, checking if subscriber has email ending with "@gmail.com". ✅

  // If email ends with "@gmail.com", subscriber should get removed from the email list. End automation.

  // If not ends with "@gmail.com", subscriber should:

  // 1. Receive another email with 90% discount ✅
  // 2. wait 5 days ✅
  // 3. Check if subscriber has "purchased-book" tag. If yes, add them to list "Purchasers". End automation. If no, remove them from email list. End automation. ✅

  // Provide sample api responses for each of the endpoints related to automations . all automation points must be their own database rows to allow for full flexibility to allow for features like drag and drop and reordering of automation points

  return {
    id: automationId,
    receiveWelcomeEmailautomationStepId,
    hasTagAddToAudienceautomationId,
    attachesTagsAutomationStepId,
    emailId,
    attachTagIds,
    detachTagIds,
    detachesTagsAutomationStepId,
  }
}
