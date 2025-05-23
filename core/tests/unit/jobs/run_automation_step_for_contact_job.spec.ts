import { and, eq } from 'drizzle-orm'
import { describe, test, vi } from 'vitest'

import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'

import { RunAutomationStepForContactJob } from '#root/core/automations/jobs/run_automation_step_for_contact_job.js'

import { createFakeContact } from '#root/core/tests/mocks/audiences/contacts.js'
import {
  createSenderIdentityForTeam,
  createUser,
} from '#root/core/tests/mocks/auth/users.js'
import { seedAutomation } from '#root/core/tests/mocks/teams/teams.js'

import {
  contactAutomationSteps,
  contacts,
  tagsOnContacts,
} from '#root/database/schema.js'

import { makeDatabase, makeLogger, makeRedis } from '#root/core/shared/container/index.js'
import { MailBuilder, Mailer } from '#root/core/shared/mailers/mailer.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'

import { container } from '#root/core/utils/typi.js'
import type { MailerDriverResponse } from '#root/core/shared/mailers/mailer_types.js'
import type { SentMessageInfo, Transporter } from 'nodemailer'

describe('@run-automation-step-for-contact-job - Run automation step for contact job', () => {
  test('automation step action: send email for a contact', async ({ expect }) => {
    const { audience, team } = await createUser()

    const database = makeDatabase()
    const redis = makeRedis()
    const senderIdentityId = await createSenderIdentityForTeam(team.id)

    const { receiveWelcomeEmailautomationStepId } = await seedAutomation({
      audienceId: audience.id,
      senderIdentityId,
    })

    const messageId = cuid()

    const fakeSendFn = vi.fn(
      async () => [{ messageId }] as unknown as [MailerDriverResponse, Error | null],
    )

    class FakeMailer extends MailBuilder {
      send = fakeSendFn
    }

    vi.spyOn(Mailer, 'from').mockImplementation(() => {
      return new FakeMailer({} as unknown as Transporter<SentMessageInfo>)
    })

    const contactId = cuid()
    await database
      .insert(contacts)
      .values({ ...createFakeContact(audience.id), id: contactId })

    await new RunAutomationStepForContactJob().handle({
      database,
      payload: {
        automationStepId: receiveWelcomeEmailautomationStepId as string,
        contactId,
      },
      redis,
      logger: makeLogger(),
    })

    expect(fakeSendFn.mock.calls).toHaveLength(1)

    const [completed] = await database
      .select()
      .from(contactAutomationSteps)
      .where(
        and(
          eq(contactAutomationSteps.contactId, contactId),
          eq(
            contactAutomationSteps.automationStepId,
            receiveWelcomeEmailautomationStepId as string,
          ),
          eq(contactAutomationSteps.status, 'COMPLETED'),
        ),
      )

    expect(completed).toBeDefined()

    const send = await redis.get(messageId)

    expect(send).toBeDefined()

    expect(send).toEqual(`AUTOMATION_STEP:${completed?.automationStepId}:${contactId}`)
  })

  test('automation step action: attach tags for a contact', async ({ expect }) => {
    const { audience } = await createUser()

    const database = makeDatabase()
    const redis = makeRedis()

    const { attachesTagsAutomationStepId, attachTagIds } = await seedAutomation({
      audienceId: audience.id,
    })

    const contactId = cuid()
    await database
      .insert(contacts)
      .values({ ...createFakeContact(audience.id), id: contactId })

    // Insert automation steps for contacts before starting to process job.

    await new RunAutomationStepForContactJob().handle({
      database,
      redis,
      payload: {
        automationStepId: attachesTagsAutomationStepId as string,
        contactId,
      },
      logger: makeLogger(),
    })

    const completed = await database.query.contactAutomationSteps.findFirst({
      where: and(
        eq(contactAutomationSteps.contactId, contactId),
        eq(
          contactAutomationSteps.automationStepId,
          attachesTagsAutomationStepId as string,
        ),
        eq(contactAutomationSteps.status, 'COMPLETED'),
      ),
    })

    const tagsForContact = await database.query.tagsOnContacts.findMany({
      where: eq(tagsOnContacts.contactId, contactId),
    })

    expect(tagsForContact.map((tag) => tag.tagId).sort()).toEqual(attachTagIds?.sort())

    expect(completed).toBeDefined()
  })

  test('automation step action: detach tags from a contact', async ({ expect }) => {
    const { audience } = await createUser()

    const database = makeDatabase()
    const redis = makeRedis()

    const { detachesTagsAutomationStepId, detachTagIds = [] } = await seedAutomation({
      audienceId: audience.id,
    })

    const contactId = cuid()
    await database
      .insert(contacts)
      .values({ ...createFakeContact(audience.id), id: contactId })

    await container.resolve(ContactRepository).attachTags(contactId, detachTagIds)

    await new RunAutomationStepForContactJob().handle({
      database,
      redis,
      payload: {
        automationStepId: detachesTagsAutomationStepId as string,
        contactId: contactId,
      },
      logger: makeLogger(),
    })

    const completed = await database.query.contactAutomationSteps.findFirst({
      where: and(
        eq(contactAutomationSteps.contactId, contactId),
        eq(
          contactAutomationSteps.automationStepId,
          detachesTagsAutomationStepId as string,
        ),
        eq(contactAutomationSteps.status, 'COMPLETED'),
      ),
    })

    const tagsForContact = await database.query.tagsOnContacts.findMany({
      where: eq(tagsOnContacts.contactId, contactId),
    })

    expect(tagsForContact).toHaveLength(0)

    expect(completed).toBeDefined()
  })
})
