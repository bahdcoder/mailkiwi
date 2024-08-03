import { describe, test, vi } from "vitest";
import { createUser } from "@/tests/mocks/auth/users.ts";
import * as queues from "@/shared/queue/queue.js";
import { Mailer } from "@/shared/mailers/mailer.js";
import { refreshDatabase, seedAutomation } from "@/tests/mocks/teams/teams.ts";
import { createFakeContact } from "@/tests/mocks/audiences/contacts.ts";
import {
  contactAutomationSteps,
  contacts,
  tagsOnContacts,
} from "@/database/schema/schema.ts";
import { makeDatabase } from "@/shared/container/index.js";
import { SendBroadcastJob } from "@/broadcasts/jobs/send_broadcast_job.ts";
import { Job } from "bullmq";
import { cuid } from "@/shared/utils/cuid/cuid.ts";
import { RunAutomationStepForContactJob } from "@/automations/jobs/run_automation_step_for_contact_job.ts";
import type { MailerDriver } from "@/shared/mailers/mailer_types.ts";
import { and, eq } from "drizzle-orm";
import { container } from "@/utils/typi.ts";
import { ContactRepository } from "@/audiences/repositories/contact_repository.ts";

describe("Run automation step for contact job", () => {
  test("automation step action: send email for a contact", async ({
    expect,
  }) => {
    await refreshDatabase();
    const { audience } = await createUser();

    const database = makeDatabase();

    const { receiveWelcomeEmailautomationStepId } = await seedAutomation({
      audienceId: audience.id,
    });

    const automationsQueueMock = vi
      .spyOn(queues.AutomationsQueue, "add")
      .mockImplementation(
        async () => new Job(queues.AutomationsQueue, SendBroadcastJob.id, {}),
      );

    const messageId = cuid();

    const fakeSendFn = vi.fn(() => [{ messageId }] as any);

    class FakeDriver implements MailerDriver {
      send = fakeSendFn;
    }

    Mailer.setDriver(new FakeDriver());

    const contactId = cuid();

    await database
      .insert(contacts)
      .values(createFakeContact(audience.id, { id: contactId }));

    // Insert automation steps for contacts before starting to process job.

    await new RunAutomationStepForContactJob().handle({
      database,
      payload: {
        automationStepId: receiveWelcomeEmailautomationStepId as string,
        contactId: contactId,
      },
    });

    expect(fakeSendFn.mock.calls).toHaveLength(1);

    const completed = await database.query.contactAutomationSteps.findFirst({
      where: and(
        eq(contactAutomationSteps.contactId, contactId),
        eq(
          contactAutomationSteps.automationStepId,
          receiveWelcomeEmailautomationStepId ?? "",
        ),
        eq(contactAutomationSteps.status, "COMPLETED"),
      ),
    });

    const send = await database.query.sends.findFirst();

    expect(completed).toBeDefined();
    expect(send?.messageId).toEqual(messageId);
  });

  test("automation step action: attach tags for a contact", async ({
    expect,
  }) => {
    await refreshDatabase();
    const { audience } = await createUser();

    const database = makeDatabase();

    const { attachesTagsAutomationStepId, attachTagIds } = await seedAutomation(
      {
        audienceId: audience.id,
      },
    );

    const automationsQueueMock = vi
      .spyOn(queues.AutomationsQueue, "add")
      .mockImplementation(
        async () => new Job(queues.AutomationsQueue, SendBroadcastJob.id, {}),
      );

    const messageId = cuid();

    const contactId = cuid();

    await database
      .insert(contacts)
      .values(createFakeContact(audience.id, { id: contactId }));

    // Insert automation steps for contacts before starting to process job.

    await new RunAutomationStepForContactJob().handle({
      database,
      payload: {
        automationStepId: attachesTagsAutomationStepId as string,
        contactId: contactId,
      },
    });

    const completed = await database.query.contactAutomationSteps.findFirst({
      where: and(
        eq(contactAutomationSteps.contactId, contactId),
        eq(
          contactAutomationSteps.automationStepId,
          attachesTagsAutomationStepId ?? "",
        ),
        eq(contactAutomationSteps.status, "COMPLETED"),
      ),
    });

    const tagsForContact = await database.query.tagsOnContacts.findMany({
      where: eq(tagsOnContacts.contactId, contactId),
    });

    expect(tagsForContact.map((tag) => tag.tagId).sort()).toEqual(
      attachTagIds?.sort(),
    );

    expect(completed).toBeDefined();
  });

  test("automation step action: detach tags from a contact", async ({
    expect,
  }) => {
    await refreshDatabase();
    const { audience } = await createUser();

    const database = makeDatabase();

    const { detachesTagsAutomationStepId, detachTagIds = [] } =
      await seedAutomation({
        audienceId: audience.id,
      });

    const contactId = cuid();

    await database
      .insert(contacts)
      .values(createFakeContact(audience.id, { id: contactId }));

    await container
      .resolve(ContactRepository)
      .attachTags(contactId, detachTagIds);

    await new RunAutomationStepForContactJob().handle({
      database,
      payload: {
        automationStepId: detachesTagsAutomationStepId as string,
        contactId: contactId,
      },
    });

    const completed = await database.query.contactAutomationSteps.findFirst({
      where: and(
        eq(contactAutomationSteps.contactId, contactId),
        eq(
          contactAutomationSteps.automationStepId,
          detachesTagsAutomationStepId ?? "",
        ),
        eq(contactAutomationSteps.status, "COMPLETED"),
      ),
    });

    const tagsForContact = await database.query.tagsOnContacts.findMany({
      where: eq(tagsOnContacts.contactId, contactId),
    });

    expect(tagsForContact).toHaveLength(0);

    expect(completed).toBeDefined();
  });
});
