import { WEBSITES_PATH } from "@/app/env/app_env.js"
import { FormRepository } from "@/forms/repositories/form_repository.js"
import { eq } from "drizzle-orm"
import { describe, test } from "vitest"

import { createUser } from "@/tests/mocks/auth/users.js"
import { makeRequest, makeRequestAsUser } from "@/tests/utils/http.js"

import { InsertForm } from "@/database/database_schema_types.js"
import { formResponses, forms } from "@/database/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { cuid } from "@/shared/utils/cuid/cuid.js"

import { container } from "@/utils/typi.js"

describe("@forms", () => {
  const survey = {
    type: "survey",
    name: "Newsletter subscribers",
    fields: [
      {
        id: cuid(),
        type: "select",
        label: "What's your role at your current employer?",
        options: ["Engineer", "Designer", "Product Manager", "Other"],
      },
      {
        id: cuid(),
        type: "select",
        label: "How long have you been in this role ?",
        options: ["1 - 5 years", "10 - 15 years", "20+ years"],
      },
    ],
    appearance: "inline",
  } as InsertForm
  test("can create a sign up form", async ({ expect }) => {
    const { user, team } = await createUser()

    const payload = {
      type: "signup",
      name: "Newsletter subscribers",
      fields: [
        {
          id: cuid(),
          type: "email",
          label: "What is your email ?",
        },
      ],
      appearance: "inline",
    }

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: "/forms",
      body: payload,
    })

    expect(response.status).toBe(200)

    const [savedForm] = await makeDatabase()
      .select()
      .from(forms)
      .where(eq(forms.teamId, team.id))

    expect(
      savedForm.fields?.find((field) => field.type === "email"),
    ).toBeDefined()
  })

  test("can create a survey form", async ({ expect }) => {
    const { user, team } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: "/forms",
      body: survey,
    })

    expect(response.status).toBe(200)

    const [savedForm] = await makeDatabase()
      .select()
      .from(forms)
      .where(eq(forms.teamId, team.id))

    expect(savedForm.type).toEqual("survey")
    expect(savedForm.fields).toHaveLength(2)
  })

  test("can update a survey form fields by adding new fields", async ({
    expect,
  }) => {
    const { user, team, website } = await createUser({
      createWebsite: true,
    })

    const formRepository = container.make(FormRepository)

    const { id: formId } = await formRepository
      .forms()
      .create({ ...survey, teamId: team.id })

    const response = await makeRequestAsUser(user, {
      method: "PUT",
      path: `/forms/${formId}`,
      body: {
        name: `${survey.name} updated!`,
        fields: [
          ...(survey.fields || []),
          {
            type: "select",
            label: "New field",
            options: ["Option 1", "Option 2"],
          },
        ],
      },
    })

    expect(response.status).toBe(200)

    const form = await formRepository.forms().findById(formId)

    const newField = form.fields?.find(
      (field) => field.label === "New field",
    )

    expect(form.fields).toHaveLength(3)
    expect(newField).toBeDefined()
    expect(newField?.options).toEqual(["Option 1", "Option 2"])
  })

  test("can delete (archive) form fields by performing an update and excluding the fields", async ({
    expect,
  }) => {
    const { user, team, website } = await createUser({
      createWebsite: true,
    })

    const formRepository = container.make(FormRepository)

    const { id: formId } = await formRepository
      .forms()
      .create({ ...survey, teamId: team.id })

    const response = await makeRequestAsUser(user, {
      method: "PUT",
      path: `/forms/${formId}`,
      body: {
        name: `${survey.name} updated!`,
        fields: [
          survey.fields?.[0],
          {
            type: "select",
            label: "New field",
            options: ["Option 1", "Option 2"],
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

  test("can delete a form", async ({ expect }) => {
    const { user, team, website } = await createUser({
      createWebsite: true,
    })

    const formRepository = container.make(FormRepository)

    const { id: formId } = await formRepository
      .forms()
      .create({ ...survey, teamId: team.id })

    const response = await makeRequestAsUser(user, {
      method: "DELETE",
      path: `/forms/${formId}`,
    })

    expect(response.status).toBe(200)

    const form = await formRepository.forms().findById(formId)

    expect(form.archivedAt).toBeDefined()
  })

  test("can submit a form response as an authenticated contact", async ({
    expect,
  }) => {
    const { user, team, website } = await createUser({
      createWebsite: true,
    })

    const { id: formId } = await container
      .make(FormRepository)
      .forms()
      .create({ ...survey, teamId: team.id })

    const form = await container
      .make(FormRepository)
      .forms()
      .findById(formId)

    const submitContent: Record<string, string[]> = {}

    for (const field of form.fields || []) {
      const surveyField = survey.fields?.find(
        (surveyField) => surveyField.id === field.id,
      )

      if (surveyField && surveyField.options && field.id) {
        submitContent[field.id] = [surveyField.options[0]]
      }
    }

    const response = await makeRequest(
      `${WEBSITES_PATH}/${website.slug}/forms/${formId}/responses`,
      {
        method: "POST",
        body: submitContent,
      },
    )

    const [formResponse] = await makeDatabase()
      .select()
      .from(formResponses)
      .where(eq(formResponses.formId, formId))
      .limit(1)

    expect(response.status).toBe(200)

    expect(formResponse).toBeDefined()
    expect(formResponse.formId).toEqual(formId)
  })
})
