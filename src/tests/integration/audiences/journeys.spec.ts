import { eq } from "drizzle-orm"
import { describe, test } from "vitest"

import { cuid } from "@/domains/shared/utils/cuid/cuid.ts"
import { makeDatabase } from "@/infrastructure/container.js"
import {
  journeyPoints,
  journeys,
} from "@/infrastructure/database/schema/schema.ts"
import { createUser } from "@/tests/mocks/auth/users.js"
import { cleanMailers } from "@/tests/mocks/teams/teams.ts"

describe("Contact journeys", () => {
  test("experimenting with journeys", async () => {
    await cleanMailers()
    const { audience } = await createUser()

    const database = makeDatabase()

    const journeyId = cuid()

    await database.insert(journeys).values({
      id: journeyId,
      name: "Book launch",
      audienceId: audience.id,
      description: "Launch a book for the December End of Year Sales.",
    })

    // Now create sample data for a journey that looks like this:
    const startingTriggerJourneyPointId = cuid()

    await database
      .insert(journeyPoints)
      .values({
        id: startingTriggerJourneyPointId,
        journeyId,
        name: "User subscribes to email list",
        description: "User subscribes to email list",
        type: "TRIGGER",
        subtype: "TRIGGER_CONTACT_SUBSCRIBED",
        configuration: JSON.stringify({}),
      })
      .execute()

    const receiveWelcomeEmailJourneyPointId = cuid()

    await database
      .insert(journeyPoints)
      .values({
        id: receiveWelcomeEmailJourneyPointId,
        journeyId,
        parentId: startingTriggerJourneyPointId,
        name: "Receive a Welcome email",
        type: "ACTION",
        subtype: "ACTION_SEND_EMAIL",
        configuration: JSON.stringify({ subject: "Welcome to the company!" }),
      })
      .execute()

    const waitsTwoDaysJourneyPointId = cuid()

    await database
      .insert(journeyPoints)
      .values({
        id: waitsTwoDaysJourneyPointId,
        journeyId,
        parentId: receiveWelcomeEmailJourneyPointId,
        name: "Waits two days",
        type: "RULE",
        subtype: "RULE_WAIT_FOR_DURATION",
        configuration: JSON.stringify({ delay: "2 days" }),
      })
      .execute()

    const receiveSecondEmailEmailJourneyPointId = cuid()

    await database
      .insert(journeyPoints)
      .values({
        id: receiveSecondEmailEmailJourneyPointId,
        journeyId,
        parentId: waitsTwoDaysJourneyPointId,
        name: "Receive a second email",
        type: "ACTION",
        subtype: "ACTION_SEND_EMAIL",
        configuration: JSON.stringify({ subject: "Did you get my book?" }),
      })
      .execute()

    const waitsOneDayJourneyPointId = cuid()

    await database
      .insert(journeyPoints)
      .values({
        id: waitsOneDayJourneyPointId,
        journeyId,
        parentId: receiveSecondEmailEmailJourneyPointId,
        name: "Waits one day",
        type: "RULE",
        subtype: "RULE_WAIT_FOR_DURATION",
        configuration: JSON.stringify({ delay: "1 day" }),
      })
      .execute()

    const ifElseBranchJourneyPointId = cuid()

    await database
      .insert(journeyPoints)
      .values({
        id: ifElseBranchJourneyPointId,
        journeyId,
        parentId: waitsOneDayJourneyPointId,
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

    const hasTagReceivesThankYouJourneyPointId = cuid()

    await database
      .insert(journeyPoints)
      .values({
        id: hasTagReceivesThankYouJourneyPointId,
        journeyId,
        parentId: waitsOneDayJourneyPointId,
        name: "Receives thank you email",
        type: "ACTION",
        subtype: "ACTION_SEND_EMAIL",
        configuration: JSON.stringify({
          subject: "Thank you for your purchase.",
        }),
        branchIndex: 0,
      })
      .execute()

    const hasTagWait4DaysJourneyPointId = cuid()

    await database
      .insert(journeyPoints)
      .values({
        id: hasTagWait4DaysJourneyPointId,
        journeyId,
        parentId: hasTagReceivesThankYouJourneyPointId,
        name: "Waits 4 days",
        type: "RULE",
        subtype: "RULE_WAIT_FOR_DURATION",
        configuration: JSON.stringify({ delay: "4 days" }),
      })
      .execute()

    const hasTagAddToAudienceJourneyId = cuid()

    await database
      .insert(journeyPoints)
      .values({
        id: hasTagAddToAudienceJourneyId,
        journeyId,
        parentId: hasTagWait4DaysJourneyPointId,
        name: "Subscribe to list",
        type: "ACTION",
        subtype: "ACTION_SUBSCRIBE_TO_LIST",
        configuration: JSON.stringify({ listId: "akc34b1k27xrgy0c6qygcefe" }),
      })
      .execute()

    const hasTagWait1DayJourneyPointId = cuid()

    await database
      .insert(journeyPoints)
      .values({
        id: hasTagWait1DayJourneyPointId,
        journeyId,
        parentId: hasTagAddToAudienceJourneyId,
        name: "Waits 1 day",
        type: "RULE",
        subtype: "RULE_WAIT_FOR_DURATION",
        configuration: JSON.stringify({ delay: "1 day" }),
      })
      .execute()

    const hasTagSendDiscountJourneyPointId = cuid()

    await database
      .insert(journeyPoints)
      .values({
        id: hasTagSendDiscountJourneyPointId,
        journeyId,
        parentId: hasTagWait1DayJourneyPointId,
        name: "Send discount",
        type: "ACTION",
        subtype: "ACTION_SEND_EMAIL",
        configuration: JSON.stringify({ subject: "Enjoy this discount." }),
      })
      .execute()

    const hasTagEndJourneyPointId = cuid()

    await database
      .insert(journeyPoints)
      .values({
        id: hasTagEndJourneyPointId,
        journeyId,
        parentId: hasTagSendDiscountJourneyPointId,
        name: "End journey",
        type: "END",
        subtype: "END",
        configuration: JSON.stringify({}),
      })
      .execute()
    // Starting point: User subscribes to email list ✅
    // Next journey point: Receives a welcome email ✅
    // Next journey point: Waits 2 days ✅
    // Next journey point: Receives a second email about my book ✅
    // Next journey point: Waits 1 day ✅
    // Next journey point: A branch, if / else statement checking if the subscriber has a tag "purchased-book" or not ✅
    // Journey for If has tag purchased book, journey is:
    // 1. Receives thank you email for purchasing ✅
    // 2. wait 4 days. ✅
    // 3. Add user to new email list "Purchasers" ✅
    // 4. Wait 1 day ✅
    // 5. Send discount for purchasing online course ✅
    // 6. End journey. ✅

    // Journey for if subscriber does not have the "purchased-book" tag:

    // 1. Receives email with an 80% discount
    // 2. wait 3 days
    // 3. Journey splits again with if / else statement, checking if subscriber has email ending with "@gmail.com".

    // If email ends with "@gmail.com", subscriber should get removed from the email list. End journey.

    // If not ends with "@gmail.com", subscriber should:

    // 1. Receive another email with 90% discount
    // 2. wait 5 days
    // 3. Check if subscriber has "purchased-book" tag. If yes, add them to list "Purchasers". End journey. If no, remove them from email list. End journey.

    // Provide sample api responses for each of the endpoints related to journeys . all journey points must be their own database rows to allow for full flexibility to allow for features like drag and drop and reordering of journey points

    const journeyFetch = await database.query.journeys.findFirst({
      where: eq(journeys.id, journeyId),
      with: {
        points: true,
      },
    })

    d(journeyFetch)
  })
})
