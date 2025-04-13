import { faker } from "@faker-js/faker"
import { describe, test } from "vitest"

import { RunAutomationForContactJob } from "@/automations/jobs/run_automation_for_contact_job.js"
import { TriggerAutomationsForContactJob } from "@/automations/jobs/trigger_automation_for_contact_job.js"

import {
  createContactsForAudience,
  createUser,
} from "@/tests/mocks/auth/users.js"
import { seedAutomation } from "@/tests/mocks/teams/teams.js"

import { tags, tagsOnContacts } from "@/database/schema.js"

import {
  makeDatabase,
  makeLogger,
  makeRedis,
} from "@/shared/container/index.js"
import { Queue } from "@/shared/queue/queue.js"
import { cuid } from "@/shared/utils/cuid/cuid.js"

import { container } from "@/utils/typi.js"

describe("@automations-trigger", () => {
  test("can trigger automations for a contact", async ({ expect }) => {
    const { audience } = await createUser()

    const database = makeDatabase()
    const redis = makeRedis()

    const { contactIds } = await createContactsForAudience(audience.id, 1)

    const tagIds = faker.helpers.multiple(cuid, { count: 3 })

    await database.insert(tags).values(
      tagIds.map((tag) => ({
        id: tag,
        name: tag,
        audienceId: audience.id,
      }))
    )

    await database.insert(tagsOnContacts).values(
      tagIds.map((tagId) => ({
        contactId: contactIds[0],
        tagId,
      }))
    )

    const { automationId } = await seedAutomation({
      audienceId: audience.id,
      trigger: "TRIGGER_CONTACT_TAG_ADDED",
      triggerConfiguration: {
        tagIds,
      },
    })

    await container.make(TriggerAutomationsForContactJob).handle({
      payload: {
        trigger: "TRIGGER_CONTACT_TAG_ADDED",
        contactId: contactIds[0],
      },
      redis,
      database,
      logger: makeLogger(),
    })

    const jobs = await Queue.automations().getJobs()

    const automationJobs = jobs.filter(
      (job) =>
        job.name === RunAutomationForContactJob.id &&
        job.data.contactId === contactIds[0]
    )

    expect(automationJobs.map((j) => j.data)).toEqual([
      {
        automationId,
        contactId: contactIds[0],
      },
    ])
  })
})
