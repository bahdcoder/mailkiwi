import { eq } from "drizzle-orm"
import { describe, test } from "vitest"

import { createUser } from "@/tests/mocks/auth/users.js"
import { makeRequestAsUser } from "@/tests/utils/http.js"

import { forms } from "@/database/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { cuid } from "@/shared/utils/cuid/cuid.js"

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
  }
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

  test("can submit a form response as an authenticated contact", async ({
    expect,
  }) => {
    const { user, team } = await createUser()

    return
  })
})
