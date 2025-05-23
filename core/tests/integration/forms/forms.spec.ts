import { WEBSITES_PATH } from '#root/core/app/env/app_env.js'
import { TagContactBasedOnResponseJob } from '#root/core/forms/jobs/tag_contact_based_on_response_job.js'
import { FormRepository } from '#root/core/forms/repositories/form_repository.js'
import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { describe, test } from 'vitest'

import { createUser } from '#root/core/tests/mocks/auth/users.js'
import { makeRequest, makeRequestAsUser } from '#root/core/tests/utils/http.js'

import type { InsertForm } from '#root/database/database_schema_types.js'
import { contacts, formResponses, forms } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { Queue } from '#root/core/shared/queue/queue.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'

import { container } from '#root/core/utils/typi.js'
import { survey } from '#root/core/tests/integration/helpers/forms/survey.js'

describe('@forms', () => {
  test('can create a sign up form', async ({ expect }) => {
    const { user, audience } = await createUser()

    const payload = {
      type: 'signup',
      name: 'Newsletter subscribers',
      fields: [
        {
          id: 'email',
          type: 'email',
          label: 'What is your email ?',
        },
        {
          id: 'lastname',
          type: 'text',
          label: 'What is your last name?',
        },
      ],
      appearance: 'inline',
    }

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/audiences/${audience.id}/forms`,
      body: payload,
    })

    expect(response.status).toBe(200)

    const [savedForm] = await makeDatabase()
      .select()
      .from(forms)
      .where(eq(forms.audienceId, audience.id))

    expect(savedForm.fields?.find((field) => field.type === 'email')).toBeDefined()
  })

  test('can create a survey form', async ({ expect }) => {
    const { user, audience } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/audiences/${audience.id}/forms`,
      body: survey,
    })

    expect(response.status).toBe(200)

    const [savedForm] = await makeDatabase()
      .select()
      .from(forms)
      .where(eq(forms.audienceId, audience.id))

    expect(savedForm.type).toEqual('survey')
    expect(savedForm.fields).toHaveLength(2)
  })

  test('can update a survey form fields by adding new fields', async ({ expect }) => {
    const { user, audience } = await createUser({
      createWebsite: true,
    })

    const formRepository = container.make(FormRepository)

    const { id: formId } = await formRepository
      .forms()
      .create({ ...survey, audienceId: audience.id })

    const response = await makeRequestAsUser(user, {
      method: 'PUT',
      path: `/audiences/${audience.id}/forms/${formId}`,
      body: {
        name: `${survey.name} updated!`,
        fields: [
          ...(survey.fields || []),
          {
            type: 'select',
            label: 'New field',
            options: ['Option 1', 'Option 2'],
          },
        ],
      },
    })

    expect(response.status).toBe(200)

    const form = await formRepository.forms().findById(formId)

    const newField = form.fields?.find((field) => field.label === 'New field')

    expect(form.fields).toHaveLength(3)
    expect(newField).toBeDefined()
    expect(newField?.options).toEqual(['Option 1', 'Option 2'])
  })

  test('can delete (archive) form fields by performing an update and excluding the fields', async ({
    expect,
  }) => {
    const { user, audience } = await createUser({
      createWebsite: true,
    })

    const formRepository = container.make(FormRepository)

    const { id: formId } = await formRepository
      .forms()
      .create({ ...survey, audienceId: audience.id })

    const response = await makeRequestAsUser(user, {
      method: 'PUT',
      path: `/audiences/${audience.id}/forms/${formId}`,
      body: {
        name: `${survey.name} updated!`,
        fields: [
          survey.fields?.[0],
          {
            type: 'select',
            label: 'New field',
            options: ['Option 1', 'Option 2'],
          },
        ],
      },
    })

    expect(response.status).toBe(200)

    const form = await formRepository.forms().findById(formId)

    expect(form.name).toEqual(`${survey.name} updated!`)

    const deletedFields = form.fields?.filter((field) => field.deleted)

    expect(deletedFields).toHaveLength(1)
  })

  test('can delete a form', async ({ expect }) => {
    const { user, audience } = await createUser({
      createWebsite: true,
    })

    const formRepository = container.make(FormRepository)

    const { id: formId } = await formRepository
      .forms()
      .create({ ...survey, audienceId: audience.id })

    const response = await makeRequestAsUser(user, {
      method: 'DELETE',
      path: `/audiences/${audience.id}/forms/${formId}`,
    })

    expect(response.status).toBe(200)

    const form = await formRepository.forms().findById(formId)

    expect(form.archivedAt).toBeDefined()
  })

  test('can submit a form response as an authenticated contact', async ({ expect }) => {
    const { audience, website } = await createUser({
      createWebsite: true,
    })

    const { id: formId } = await container
      .make(FormRepository)
      .forms()
      .create({ ...survey, audienceId: audience.id })

    const form = await container.make(FormRepository).forms().findById(formId)

    const submitContent: Record<string, string[]> = {}

    for (const field of form.fields || []) {
      const surveyField = survey.fields?.find(
        (surveyField) => surveyField.id === field.id,
      )

      if (surveyField?.options && field.id) {
        submitContent[field.id] = [surveyField.options[0]]
      }
    }

    const response = await makeRequest(
      `${WEBSITES_PATH}/${website.slug}/forms/${formId}/responses`,
      {
        method: 'POST',
        body: submitContent,
      },
    )

    const [formResponse] = await makeDatabase()
      .select()
      .from(formResponses)
      .where(eq(formResponses.formId, formId))
      .limit(1)

    const jobs = await Queue.contacts().getJobs()

    const tagContactBasedOnResponseJob = jobs.find(
      (job) => job.name === TagContactBasedOnResponseJob.id,
    )

    expect(tagContactBasedOnResponseJob).toBeDefined()
    expect(tagContactBasedOnResponseJob?.data.formResponseId).toEqual(formResponse.id)

    expect(response.status).toBe(200)

    expect(formResponse).toBeDefined()
    expect(formResponse.formId).toEqual(formId)
  })

  test('can submit a sign up form response as a new contact', async ({ expect }) => {
    const { audience, website } = await createUser({
      createWebsite: true,
    })

    const { id: formId } = await container
      .make(FormRepository)
      .forms()
      .create({
        type: 'signup',
        name: 'Newsletter sign up',
        fields: [
          {
            type: 'email',
            label: 'Email address',
          },
          {
            type: 'text',
            id: 'firstname',
            label: 'Enter your first name',
          },
          {
            type: 'number',
            id: 'age',
            label: 'How old are you?',
          },
        ],
        appearance: 'fullscreen',
        audienceId: audience.id,
      })

    const submitContent: Record<string, string> = {
      email: faker.number.bigInt() + faker.internet.exampleEmail(),
      firstname: faker.person.firstName(),
      lastname: faker.person.lastName(),
      age: '34',
    }

    const response = await makeRequest(
      `${WEBSITES_PATH}/${website.slug}/forms/${formId}/responses`,
      {
        method: 'POST',
        body: submitContent,
      },
    )

    expect(response.status).toBe(200)

    const [contact] = await makeDatabase()
      .select()
      .from(contacts)
      .where(eq(contacts.email, submitContent.email))

    expect(contact).toBeDefined()
    expect(contact.lastName).toEqual(submitContent.lastname)
    expect(contact.firstName).toEqual(submitContent.firstname)
  })
})
