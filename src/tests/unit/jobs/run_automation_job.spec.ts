import { faker } from "@faker-js/faker"
import { and, eq } from "drizzle-orm"
import { describe, test } from "vitest"

import { RunAutomationStepJob } from "@/automations/jobs/run_automation_step_job.js"

import { createFakeContact } from "@/tests/mocks/audiences/contacts.js"
import { createUser } from "@/tests/mocks/auth/users.js"
import { seedAutomation } from "@/tests/mocks/teams/teams.js"

import {
  automationSteps,
  contactAutomationSteps,
  contacts,
} from "@/database/schema/schema.js"

import { makeDatabase, makeRedis } from "@/shared/container/index.js"
import * as queues from "@/shared/queue/queue.js"
import { cuid } from "@/shared/utils/cuid/cuid.js"

describe("Run automation job", () => {
  test("dispatches a run automation step job for each step in the automation", async ({
    expect,
  }) => {
    const { audience } = await createUser()

    const database = makeDatabase()
    const redis = makeRedis()

    const { id: automationId } = await seedAutomation({
      audienceId: audience.id,
    })

    const totalContacts = 373
    const totalContactsNotAtStep = 32

    const contactIds = faker.helpers.multiple(cuid, {
      count: totalContacts,
    })

    await database.insert(contacts).values(
      faker.helpers
        .multiple(faker.lorem.word, {
          count: totalContacts,
        })
        .map((_, idx) =>
          createFakeContact(audience.id, {
            id: contactIds[idx],
          }),
        ),
    )

    await database.insert(contacts).values(
      faker.helpers
        .multiple(faker.lorem.word, {
          count: totalContactsNotAtStep,
        })
        .map(() => createFakeContact(audience.id)),
    )

    const automationStepSendEmail =
      await database.query.automationSteps.findFirst({
        where: and(
          eq(automationSteps.automationId, automationId),
          eq(automationSteps.subtype, "ACTION_SEND_EMAIL"),
        ),
      })

    // Insert automation steps for contacts before starting to process job.
    await database.insert(contactAutomationSteps).values(
      contactIds.map((contactId) => ({
        id: cuid(),
        contactId,
        status: "PENDING" as const,
        automationStepId: automationStepSendEmail?.id as string,
      })),
    )

    await new RunAutomationStepJob().handle({
      database,
      redis,
      payload: {
        automationStepId: automationStepSendEmail?.id as string,
      },
    })

    const jobs = await queues.Queue.automations().getJobs()

    const automationsQueueJobs = jobs.filter((job) =>
      contactIds.includes(job.data?.contactId),
    )

    expect(automationsQueueJobs.length).toBe(totalContacts)
  })
})
