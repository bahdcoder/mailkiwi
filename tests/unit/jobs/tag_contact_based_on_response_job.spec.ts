import { TagContactBasedOnResponseJob } from '@/forms/jobs/tag_contact_based_on_response_job.js'
import { FormRepository } from '@/forms/repositories/form_repository.js'
import { FormResponseRepository } from '@/forms/repositories/form_response_repository.js'
import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { describe, test } from 'vitest'

import { ContactRepository } from '@/audiences/repositories/contact_repository.js'

import { survey } from '@/tests/integration/forms/forms.spec.js'
import { createContactsForAudience, createUser } from '@/tests/mocks/auth/users.js'

import { tags, tagsOnContacts } from '@/database/schema.js'

import { makeDatabase, makeRedis } from '@/shared/container/index.js'
import { cuid } from '@/shared/utils/cuid/cuid.js'

import { container } from '@/utils/typi.js'

describe('@tag-contact', () => {
  const setup = async () => {
    const { audience } = await createUser({
      createWebsite: true,
    })

    const database = makeDatabase()

    const formRepository = container.make(FormRepository)

    const { contactIds } = await createContactsForAudience(audience.id, 1)

    const tagIds = faker.helpers.multiple(cuid, { count: 2 })

    await database.insert(tags).values(
      tagIds.map((tagId) => ({
        id: tagId,
        name: tagId,
        audienceId: audience.id,
      })),
    )

    const { id: formId } = await formRepository.forms().create({
      ...survey,
      audienceId: audience.id,
      fields: survey.fields?.map((field) => ({
        ...field,
        autoTagging: [
          {
            option: field?.autoTagging?.[0]?.option as string,
            tagId: tagIds,
          },
        ],
      })),
    })

    return { formId, tagIds, audience, contactId: contactIds?.[0] }
  }

  test('correctly tags a contact based on the form response', async ({ expect }) => {
    const { formId, contactId, tagIds } = await setup()

    const submitContent: Record<string, string[]> = {}

    survey.fields?.forEach((field) => {
      submitContent[field.id as string] = [field.options?.[0] as string]
    })

    const { id: formResponseId } = await container
      .make(FormResponseRepository)
      .responses()
      .create({
        formId,
        contactId,
        response: submitContent,
      })

    await container.make(TagContactBasedOnResponseJob).handle({
      payload: { formResponseId },
      database: makeDatabase(),
      redis: makeRedis(),
    })

    const tagsForContact = await makeDatabase()
      .select()
      .from(tagsOnContacts)
      .where(eq(tagsOnContacts.contactId, contactId))

    expect(tagsForContact).toHaveLength(2)
    expect(tagIds).toEqual(tagsForContact.map((tag) => tag.tagId))
  })
})
