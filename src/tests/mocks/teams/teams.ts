import { cuid } from "@/domains/shared/utils/cuid/cuid.js"
import { makeDatabase } from "@/infrastructure/container.js"
import {
  accessTokens,
  audiences,
  automations,
  automationSteps,
  contacts,
  mailerIdentities,
  mailers,
  teams,
  users,
} from "@/infrastructure/database/schema/schema.js"

export const refreshDatabase = async () => {
  const database = makeDatabase()

  await database.delete(mailerIdentities)
  await database.delete(mailers)
  await database.delete(contacts)
  await database.delete(automationSteps)
  await database.delete(automations)
  await database.delete(audiences)
  await database.delete(accessTokens)
  await database.delete(teams)
  await database.delete(users)
}

export const seedAutomation = async (automation: {
  audienceId: string
  name: string
  description: string
}) => {
  const database = makeDatabase()
  const automationId = cuid()

  await database.insert(automations).values({
    id: automationId,
    name: automation.name,
    audienceId: automation.audienceId,
    description: automation.description,
  })

  // Now create sample data for a automation that looks like this:
  const startingTriggerautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: startingTriggerautomationStepId,
      automationId,
      name: "User subscribes to email list",
      description: "User subscribes to email list",
      type: "TRIGGER",
      subtype: "TRIGGER_CONTACT_SUBSCRIBED",
      configuration: JSON.stringify({}),
    })
    .execute()

  const receiveWelcomeEmailautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: receiveWelcomeEmailautomationStepId,
      automationId,
      parentId: startingTriggerautomationStepId,
      name: "Receive a Welcome email",
      type: "ACTION",
      subtype: "ACTION_SEND_EMAIL",
      configuration: JSON.stringify({ subject: "Welcome to the company!" }),
    })
    .execute()

  const waitsTwoDaysautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: waitsTwoDaysautomationStepId,
      automationId,
      parentId: receiveWelcomeEmailautomationStepId,
      name: "Waits two days",
      type: "RULE",
      subtype: "RULE_WAIT_FOR_DURATION",
      configuration: JSON.stringify({ delay: "2 days" }),
    })
    .execute()

  const receiveSecondEmailEmailautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: receiveSecondEmailEmailautomationStepId,
      automationId,
      parentId: waitsTwoDaysautomationStepId,
      name: "Receive a second email",
      type: "ACTION",
      subtype: "ACTION_SEND_EMAIL",
      configuration: JSON.stringify({ subject: "Did you get my book?" }),
    })
    .execute()

  const waitsOneDayautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: waitsOneDayautomationStepId,
      automationId,
      parentId: receiveSecondEmailEmailautomationStepId,
      name: "Waits one day",
      type: "RULE",
      subtype: "RULE_WAIT_FOR_DURATION",
      configuration: JSON.stringify({ delay: "1 day" }),
    })
    .execute()

  const ifElseBranchautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: ifElseBranchautomationStepId,
      automationId,
      parentId: waitsOneDayautomationStepId,
      name: "If / Else",
      type: "RULE",
      subtype: "RULE_IF_ELSE",
      configuration: JSON.stringify({
        conditions: [
          [
            {
              field: "tags",
              operator: "ONE_OF",
              value: ["gjdbbgfyz6e9m3tk99ezp084"],
            },
          ],
        ],
      }),
    })
    .execute()

  const hasTagReceivesThankYouautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: hasTagReceivesThankYouautomationStepId,
      automationId,
      parentId: ifElseBranchautomationStepId,
      name: "Receives thank you email",
      type: "ACTION",
      subtype: "ACTION_SEND_EMAIL",
      configuration: JSON.stringify({
        subject: "Thank you for your purchase.",
      }),
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
      name: "Waits 4 days",
      type: "RULE",
      subtype: "RULE_WAIT_FOR_DURATION",
      configuration: JSON.stringify({ delay: "4 days" }),
    })
    .execute()

  const hasTagAddToAudienceautomationId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: hasTagAddToAudienceautomationId,
      automationId,
      parentId: hasTagWait4DaysautomationStepId,
      name: "Subscribe to list",
      type: "ACTION",
      subtype: "ACTION_SUBSCRIBE_TO_AUDIENCE",
      configuration: JSON.stringify({ listId: "akc34b1k27xrgy0c6qygcefe" }),
    })
    .execute()

  const hasTagWait1DayautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: hasTagWait1DayautomationStepId,
      automationId,
      parentId: hasTagAddToAudienceautomationId,
      name: "Waits 1 day",
      type: "RULE",
      subtype: "RULE_WAIT_FOR_DURATION",
      configuration: JSON.stringify({ delay: "1 day" }),
    })
    .execute()

  const hasTagSendDiscountautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: hasTagSendDiscountautomationStepId,
      automationId,
      parentId: hasTagWait1DayautomationStepId,
      name: "Send discount",
      type: "ACTION",
      subtype: "ACTION_SEND_EMAIL",
      configuration: JSON.stringify({ subject: "Enjoy this discount." }),
    })
    .execute()

  const hasTagEndautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: hasTagEndautomationStepId,
      automationId,
      parentId: hasTagSendDiscountautomationStepId,
      name: "End automation",
      type: "END",
      subtype: "END",
      configuration: JSON.stringify({}),
    })
    .execute()

  const notHasTagReceives80PercentDiscountEmailautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: notHasTagReceives80PercentDiscountEmailautomationStepId,
      automationId,
      parentId: ifElseBranchautomationStepId,
      name: "80% discount email",
      type: "ACTION",
      subtype: "ACTION_SEND_EMAIL",
      configuration: JSON.stringify({
        subject: "Enjoy this 80% discount for the course.",
      }),
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
      name: "Wait 3 Days",
      type: "RULE",
      subtype: "RULE_WAIT_FOR_DURATION",
      configuration: JSON.stringify({
        subject: "Pause for 3 days to see user behaviour.",
      }),
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
      name: "Second If / Else",
      type: "RULE",
      subtype: "RULE_IF_ELSE",
      configuration: JSON.stringify({
        conditions: [
          [
            {
              field: "email",
              operator: "ENDS_WITH",
              value: ["@gmail.com"],
            },
          ],
        ],
      }),
    })
    .execute()

  const isGmailautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: isGmailautomationStepId,
      automationId,
      parentId: secondIfElseBranchautomationStepId,
      name: "Remove contact from audience.",
      type: "ACTION",
      subtype: "ACTION_UNSUBSCRIBE_FROM_AUDIENCE",
      configuration: JSON.stringify({}),
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
      name: "Here's a 90% discount for the course.",
      type: "ACTION",
      subtype: "ACTION_SEND_EMAIL",
      configuration: JSON.stringify({
        subject: "Here's a 90% discount for the course.",
      }),
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
      name: "Wait 5 Days",
      type: "RULE",
      subtype: "RULE_WAIT_FOR_DURATION",
      configuration: JSON.stringify({}),
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
      name: "Third If / Else",
      type: "RULE",
      subtype: "RULE_IF_ELSE",
      configuration: JSON.stringify({
        conditions: [
          [
            {
              field: "tags",
              operator: "CONTAINS",
              value: ["brkkbrxhehqq0msk3jn8e02e"],
            },
          ],
        ],
      }),
    })
    .execute()

  const purchasedBookautomationStepId = cuid()

  await database
    .insert(automationSteps)
    .values({
      id: purchasedBookautomationStepId,
      automationId,
      parentId: thirdIfElseBranchautomationStepId,
      name: "Subscribe to list",
      type: "ACTION",
      subtype: "ACTION_SUBSCRIBE_TO_AUDIENCE",
      configuration: JSON.stringify({ listId: "akc34b1k27xrgy0c6qygcefe" }),
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
      name: "Unsubscribe from list",
      type: "ACTION",
      subtype: "ACTION_UNSUBSCRIBE_FROM_AUDIENCE",
      configuration: JSON.stringify({ listId: "akc34b1k27xrgy0c6qygcefe" }),
      branchIndex: 1,
    })
    .execute()
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

  return { id: automationId }
}
