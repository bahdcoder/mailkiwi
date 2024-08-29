import { and, eq } from "drizzle-orm"
import { describe, test, vi } from "vitest"

import { ContactRepository } from "@/audiences/repositories/contact_repository.ts"

import { RunAutomationStepForContactJob } from "@/automations/jobs/run_automation_step_for_contact_job.ts"

import { createFakeContact } from "@/tests/mocks/audiences/contacts.ts"
import { createUser } from "@/tests/mocks/auth/users.ts"
import {
  refreshDatabase,
  seedAutomation,
} from "@/tests/mocks/teams/teams.ts"

import {
  contactAutomationSteps,
  contacts,
  tagsOnContacts,
} from "@/database/schema/schema.ts"

import { makeDatabase, makeRedis } from "@/shared/container/index.js"
import { MailBuilder, Mailer } from "@/shared/mailers/mailer.js"
import { cuid } from "@/shared/utils/cuid/cuid.ts"

import { container } from "@/utils/typi.ts"

describe("Run automation step for contact job", () => {
  test("automation step action: send email for a contact", async ({
    expect,
  }) => {
    await refreshDatabase()
    const { audience } = await createUser()

    const database = makeDatabase()
    const redis = makeRedis()

    const { receiveWelcomeEmailautomationStepId } = await seedAutomation({
      audienceId: audience.id,
    })

    const messageId = cuid()

    const fakeSendFn = vi.fn(() => [{ messageId }] as any)

    class FakeMailer extends MailBuilder {
      send = fakeSendFn
    }

    vi.spyOn(Mailer, "from").mockImplementation(() => {
      return new FakeMailer({} as any) as any
    })

    const contactId = cuid()

    await database
      .insert(contacts)
      .values(createFakeContact(audience.id, { id: contactId }))

    await new RunAutomationStepForContactJob().handle({
      database,
      payload: {
        automationStepId: receiveWelcomeEmailautomationStepId as string,
        contactId: contactId,
      },
      redis,
    })

    expect(fakeSendFn.mock.calls).toHaveLength(1)

    const completed =
      await database.query.contactAutomationSteps.findFirst({
        where: and(
          eq(contactAutomationSteps.contactId, contactId),
          eq(
            contactAutomationSteps.automationStepId,
            receiveWelcomeEmailautomationStepId ?? "",
          ),
          eq(contactAutomationSteps.status, "COMPLETED"),
        ),
      })

    expect(completed).toBeDefined()

    const send = await redis.get(messageId)

    expect(send).toBeDefined()

    expect(send).toEqual(
      `AUTOMATION_STEP:${completed?.automationStepId}:${contactId}`,
    )
  })

  test("automation step action: attach tags for a contact", async ({
    expect,
  }) => {
    await refreshDatabase()
    const { audience } = await createUser()

    const database = makeDatabase()
    const redis = makeRedis()

    const { attachesTagsAutomationStepId, attachTagIds } =
      await seedAutomation({
        audienceId: audience.id,
      })

    const contactId = cuid()

    await database
      .insert(contacts)
      .values(createFakeContact(audience.id, { id: contactId }))

    // Insert automation steps for contacts before starting to process job.

    await new RunAutomationStepForContactJob().handle({
      database,
      redis,
      payload: {
        automationStepId: attachesTagsAutomationStepId as string,
        contactId: contactId,
      },
    })

    const completed =
      await database.query.contactAutomationSteps.findFirst({
        where: and(
          eq(contactAutomationSteps.contactId, contactId),
          eq(
            contactAutomationSteps.automationStepId,
            attachesTagsAutomationStepId ?? "",
          ),
          eq(contactAutomationSteps.status, "COMPLETED"),
        ),
      })

    const tagsForContact = await database.query.tagsOnContacts.findMany({
      where: eq(tagsOnContacts.contactId, contactId),
    })

    expect(tagsForContact.map((tag) => tag.tagId).sort()).toEqual(
      attachTagIds?.sort(),
    )

    expect(completed).toBeDefined()
  })

  test("automation step action: detach tags from a contact", async ({
    expect,
  }) => {
    await refreshDatabase()
    const { audience } = await createUser()

    const database = makeDatabase()
    const redis = makeRedis()

    const { detachesTagsAutomationStepId, detachTagIds = [] } =
      await seedAutomation({
        audienceId: audience.id,
      })

    const contactId = cuid()

    await database
      .insert(contacts)
      .values(createFakeContact(audience.id, { id: contactId }))

    await container
      .resolve(ContactRepository)
      .attachTags(contactId, detachTagIds)

    await new RunAutomationStepForContactJob().handle({
      database,
      redis,
      payload: {
        automationStepId: detachesTagsAutomationStepId as string,
        contactId: contactId,
      },
    })

    const completed =
      await database.query.contactAutomationSteps.findFirst({
        where: and(
          eq(contactAutomationSteps.contactId, contactId),
          eq(
            contactAutomationSteps.automationStepId,
            detachesTagsAutomationStepId ?? "",
          ),
          eq(contactAutomationSteps.status, "COMPLETED"),
        ),
      })

    const tagsForContact = await database.query.tagsOnContacts.findMany({
      where: eq(tagsOnContacts.contactId, contactId),
    })

    expect(tagsForContact).toHaveLength(0)

    expect(completed).toBeDefined()
  })
})
