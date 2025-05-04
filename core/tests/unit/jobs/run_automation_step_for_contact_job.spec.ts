import { and, eq } from 'drizzle-orm'
import { describe, test, vi } from 'vitest'

import { ContactRepository } from '@/audiences/repositories/contact_repository.js'
import { EmailRepository } from '@/emails/repositories/email_repository.js'

import { RunAutomationStepForContactJob } from '@/automations/jobs/run_automation_step_for_contact_job.js'
import { AutomationStepRepository } from '@/automations/repositories/automation_step_repository.js'
import { SenderIdentityRepository } from '@/sending_domains/repositories/sender_identity_repository.js'
import { SendingDomainRepository } from '@/sending_domains/repositories/sending_domain_repository.js'

import { createFakeContact } from '@/tests/mocks/audiences/contacts.js'
import { createUser } from '@/tests/mocks/auth/users.js'

import {
  contactAutomationSteps,
  contacts,
  tags,
  tagsOnContacts,
} from '@/database/schema.js'

import { makeDatabase, makeLogger, makeRedis } from '@/shared/container/index.js'
import { MailBuilder, Mailer } from '@/shared/mailers/mailer.js'
import { cuid } from '@/shared/utils/cuid/cuid.js'

import { container } from '@/utils/typi.js'
import type { MailerDriverResponse } from '@/shared/mailers/mailer_types.js'
import type { SentMessageInfo, Transporter } from 'nodemailer'

describe('Run automation step for contact job', () => {
  test('automation step action: send email for a contact', async ({ expect }) => {
    const { audience, team } = await createUser()

    const database = makeDatabase()
    const redis = makeRedis()

    // Mock the EmailRepository.findById method
    vi.spyOn(EmailRepository.prototype, 'findById').mockResolvedValue({
      id: 'mock-email-id',
      title: 'Test Email',
      type: 'AUTOMATION',
      audienceId: audience.id,
      emailContent: {
        contentHtml: '<p>Test HTML content</p>',
        contentText: 'Test text content',
        subject: 'Test Subject',
      },
      senderIdentityId: 'mock-sender-id',
    } as any)

    // Mock the SenderIdentityRepository.findById method
    vi.spyOn(SenderIdentityRepository.prototype, 'findById').mockResolvedValue({
      id: 'mock-sender-id',
      name: 'Test Sender',
      email: 'test',
      sendingDomainId: 'mock-domain-id',
      teamId: team.id,
      replyToEmail: 'reply@test.com',
    } as any)

    // Mock the SendingDomainRepository.findById method
    vi.spyOn(SendingDomainRepository.prototype, 'findById').mockResolvedValue({
      id: 'mock-domain-id',
      name: 'test.com',
      teamId: team.id,
      product: 'engage',
      dkimSubDomain: 'dkim',
      returnPathSubDomain: 'bounces',
      trackingSubDomain: 'track',
    } as any)

    // Mock the AutomationStepRepository.findById method
    vi.spyOn(AutomationStepRepository.prototype, 'findById').mockResolvedValue({
      id: 'mock-automation-step-id',
      automationId: 'mock-automation-id',
      type: 'ACTION',
      subtype: 'ACTION_SEND_EMAIL',
      configuration: {
        emailId: 'mock-email-id',
      },
    } as any)

    const automationStepId = 'mock-automation-step-id'
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
        automationStepId,
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
          eq(contactAutomationSteps.automationStepId, automationStepId),
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

    // Create tag IDs
    const attachTagIds = [cuid(), cuid()]

    // Create tags in the database
    for (const tagId of attachTagIds) {
      await database.insert(tags).values({
        id: tagId,
        name: `Tag ${tagId}`,
        audienceId: audience.id,
      })
    }

    // Mock the AutomationStepRepository.findById method
    const automationStepId = cuid()
    vi.spyOn(AutomationStepRepository.prototype, 'findById').mockResolvedValue({
      id: automationStepId,
      automationId: 'mock-automation-id',
      type: 'ACTION',
      subtype: 'ACTION_ADD_TAG',
      configuration: {
        tagIds: attachTagIds,
      },
    } as any)

    const contactId = cuid()
    await database
      .insert(contacts)
      .values({ ...createFakeContact(audience.id), id: contactId })

    // Insert automation steps for contacts before starting to process job.

    await new RunAutomationStepForContactJob().handle({
      database,
      redis,
      payload: {
        automationStepId,
        contactId,
      },
      logger: makeLogger(),
    })

    const completed = await database.query.contactAutomationSteps.findFirst({
      where: and(
        eq(contactAutomationSteps.contactId, contactId),
        eq(contactAutomationSteps.automationStepId, automationStepId),
        eq(contactAutomationSteps.status, 'COMPLETED'),
      ),
    })

    const tagsForContact = await database.query.tagsOnContacts.findMany({
      where: eq(tagsOnContacts.contactId, contactId),
    })

    expect(tagsForContact.map((tag) => tag.tagId).sort()).toEqual(attachTagIds.sort())

    expect(completed).toBeDefined()
  })

  test('automation step action: detach tags from a contact', async ({ expect }) => {
    const { audience } = await createUser()

    const database = makeDatabase()
    const redis = makeRedis()

    // Create tag IDs
    const detachTagIds = [cuid(), cuid()]

    // Create tags in the database
    for (const tagId of detachTagIds) {
      await database.insert(tags).values({
        id: tagId,
        name: `Tag ${tagId}`,
        audienceId: audience.id,
      })
    }

    // Mock the AutomationStepRepository.findById method
    const automationStepId = cuid()
    vi.spyOn(AutomationStepRepository.prototype, 'findById').mockResolvedValue({
      id: automationStepId,
      automationId: 'mock-automation-id',
      type: 'ACTION',
      subtype: 'ACTION_REMOVE_TAG',
      configuration: {
        tagIds: detachTagIds,
      },
    } as any)

    const contactId = cuid()
    await database
      .insert(contacts)
      .values({ ...createFakeContact(audience.id), id: contactId })

    // Insert tags for contact
    for (const tagId of detachTagIds) {
      await database.insert(tagsOnContacts).values({
        contactId,
        tagId,
      })
    }

    await new RunAutomationStepForContactJob().handle({
      database,
      redis,
      payload: {
        automationStepId,
        contactId,
      },
      logger: makeLogger(),
    })

    const completed = await database.query.contactAutomationSteps.findFirst({
      where: and(
        eq(contactAutomationSteps.contactId, contactId),
        eq(contactAutomationSteps.automationStepId, automationStepId),
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
