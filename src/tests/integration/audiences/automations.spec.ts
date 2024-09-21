import { faker } from "@faker-js/faker"
import { eq } from "drizzle-orm"
import { describe, test } from "vitest"

import { AutomationRepository } from "@/automations/repositories/automation_repository.js"

import { createUser } from "@/tests/mocks/auth/users.js"
import { seedAutomation } from "@/tests/mocks/teams/teams.js"
import { makeRequestAsUser } from "@/tests/utils/http.js"

import {
  audiences,
  automationSteps,
  automations,
  emails,
  tags,
} from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { cuid } from "@/shared/utils/cuid/cuid.js"

import { container } from "@/utils/typi.js"

describe.concurrent("@automations", () => {
  test("experimenting with automations", async ({ expect }) => {
    const { audience } = await createUser()

    const database = makeDatabase()

    const automation = await seedAutomation({
      audienceId: audience.id,
      name: "Book launch",
      description: "Launch your book with these automated steps.",
    })

    interface AutomationStep {
      id: string
      parentId: string | null
      subtype: string
      branchIndex: number | null
    }

    interface FlatTreeNode extends AutomationStep {
      branches?: { [key: number]: FlatTreeNode[] }
    }

    function createFlatAutomationTree(
      steps: AutomationStep[],
    ): FlatTreeNode[] {
      const nodeMap: { [key: string]: FlatTreeNode } = {}

      // Create nodes for all steps
      for (const step of steps) {
        nodeMap[step.id] = { ...step }
      }

      function processNode(nodeId: string): FlatTreeNode[] {
        const node = nodeMap[nodeId]
        const result: FlatTreeNode[] = [node]

        if (node.subtype === "RULE_IF_ELSE") {
          node.branches = {}

          for (const step of steps) {
            if (step.parentId === node.id) {
              const branchIndex =
                step.branchIndex !== null ? step.branchIndex : 0
              if (!node.branches?.[branchIndex]) {
                node.branches[branchIndex] = []
              }
              node.branches[branchIndex] = node.branches?.[
                branchIndex
              ].concat(processNode(step.id))
            }
          }
        } else {
          const children = steps.filter(
            (step) => step.parentId === node.id,
          )

          for (const child of children) {
            result.push(...processNode(child.id))
          }
        }

        return result
      }

      const rootNodes = steps.filter((step) => step.parentId === null)
      let flatTree: FlatTreeNode[] = []

      for (const rootNode of rootNodes) {
        flatTree = flatTree.concat(processNode(rootNode.id))
      }

      return flatTree
    }

    const automationFetch = await container
      .make(AutomationRepository)
      .findById(automation.id)

    const tree = createFlatAutomationTree(
      automationFetch?.steps ?? [],
    ) as FlatTreeNode[]

    expect(
      tree[7]?.branches?.["1"]?.[2]?.branches?.["1"]?.[2]?.branches?.[
        "1"
      ]?.[0]?.subtype,
    ).toEqual("ACTION_UNSUBSCRIBE_FROM_AUDIENCE")
  })

  test("can create an automation", async ({ expect }) => {
    const { user, audience } = await createUser()

    const database = makeDatabase()

    const payload = {
      name: faker.string.uuid(),
    }

    const response = await makeRequestAsUser(user, {
      body: payload,
      method: "POST",
      path: `/audiences/${audience.id}/automations`,
    })

    const savedAutomation = await database.query.automations.findFirst({
      where: eq(automations.name, payload.name),
    })

    expect(savedAutomation).toBeDefined()
    expect(savedAutomation?.id).toEqual((await response.json()).id)
  })

  test("can create ACTION_SEND_EMAIL automation step type", async ({
    expect,
  }) => {
    const { user, audience } = await createUser()
    const automation = await seedAutomation(
      { audienceId: audience.id },
      false,
    )
    const database = makeDatabase()

    const emailId = cuid()

    await database.insert(emails).values({
      id: emailId,
      title: faker.lorem.words(2),
      type: "AUTOMATION",
      audienceId: audience.id,
    })

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/automations/${automation.id}/steps`,
      body: {
        type: "ACTION",
        subtype: "ACTION_SEND_EMAIL",
        configuration: {},
        emailId,
      },
    })

    const json = await response.json()

    expect(response.status).toBe(201)

    const createdStep = await database.query.automationSteps.findFirst({
      where: eq(automationSteps.id, json.id),
    })

    expect(createdStep?.type).toBe("ACTION")
    expect(createdStep?.subtype).toBe("ACTION_SEND_EMAIL")
    expect(createdStep?.emailId).toBe(emailId)
  })

  test("can create ACTION_ADD_TAG automation step type", async ({
    expect,
  }) => {
    const { user, audience } = await createUser()
    const automation = await seedAutomation(
      { audienceId: audience.id },
      false,
    )
    const database = makeDatabase()

    const tagId = cuid()

    await database.insert(tags).values({
      id: tagId,
      name: faker.lorem.word(),
      audienceId: audience.id,
    })

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/automations/${automation.id}/steps`,
      body: {
        type: "ACTION",
        subtype: "ACTION_ADD_TAG",
        configuration: {},
        tagId,
      },
    })

    expect(response.status).toBe(201)
    const createdStep = await database.query.automationSteps.findFirst({
      where: eq(automationSteps.id, (await response.json()).id),
    })
    expect(createdStep?.type).toBe("ACTION")
    expect(createdStep?.subtype).toBe("ACTION_ADD_TAG")
    expect(createdStep?.tagId).toBe(tagId)
  })

  test("can create ACTION_SUBSCRIBE_TO_AUDIENCE automation step type", async ({
    expect,
  }) => {
    const { user, audience } = await createUser()
    const automation = await seedAutomation(
      { audienceId: audience.id },
      true,
    )
    const database = makeDatabase()

    const audienceId = cuid()

    await database.insert(audiences).values({
      id: audienceId,
      name: faker.lorem.word(),
      teamId: user?.teams?.[0]?.id,
    })

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/automations/${automation.id}/steps`,
      body: {
        type: "ACTION",
        subtype: "ACTION_SUBSCRIBE_TO_AUDIENCE",
        configuration: {},
        audienceId,
      },
    })

    expect(response.status).toBe(201)
    const createdStep = await database.query.automationSteps.findFirst({
      where: eq(automationSteps.id, (await response.json()).id),
    })
    expect(createdStep?.type).toBe("ACTION")
    expect(createdStep?.subtype).toBe("ACTION_SUBSCRIBE_TO_AUDIENCE")
    expect(createdStep?.audienceId).toBe(audienceId)
  })
})

describe.concurrent("@automations steps", () => {
  test("can create a valid automation step for an automation", async ({
    expect,
  }) => {
    const { user, audience } = await createUser()
    const database = makeDatabase()

    const automation = await seedAutomation(
      {
        audienceId: audience.id,
        name: "Book launch",
        description: "",
      },
      false,
    )

    const stepData = {
      type: "TRIGGER",
      subtype: "TRIGGER_CONTACT_SUBSCRIBED",
      configuration: {},
    }

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/automations/${automation.id}/steps`,
      body: stepData,
    })

    const json = await response.json()

    expect(response.status).toBe(201)
    const createdStep = await database.query.automationSteps.findFirst({
      where: eq(automationSteps.id, json.id),
    })

    expect(createdStep).toMatchObject(stepData)
  })

  test("cannot create an automation step with an invalid parent Id", async ({
    expect,
  }) => {
    const { user, audience } = await createUser()
    const automation = await seedAutomation(
      { audienceId: audience.id },
      false,
    )

    const stepData = {
      type: "TRIGGER",
      subtype: "TRIGGER_CONTACT_SUBSCRIBED",
      parentId: faker.string.uuid(), // Invalid parent ID
      configuration: {},
    }

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/automations/${automation.id}/steps`,
      body: stepData,
    })

    expect(response.status).toBe(422)
  })

  test("no two automation steps can have the same parent id", async ({
    expect,
  }) => {
    const { user, audience } = await createUser()
    const automation = await seedAutomation(
      { audienceId: audience.id },
      false,
    )
    const database = makeDatabase()

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/automations/${automation.id}/steps`,
      body: {
        type: "TRIGGER",
        subtype: "TRIGGER_CONTACT_SUBSCRIBED",
        configuration: {},
      },
    })

    const { id: parentId } = await response.json()

    // Create second step with the parent
    const stepData1 = {
      type: "ACTION",
      subtype: "ACTION_UPDATE_CONTACT_ATTRIBUTES",
      parentId,
      configuration: {
        add: { age: 25 },
        remove: { hobby: ["reading"] },
      },
    }

    const response1 = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/automations/${automation.id}/steps`,
      body: stepData1,
    })

    expect(response1.status).toBe(201)

    // Try to create another step with the same parent
    const stepData2 = {
      type: "ACTION",
      subtype: "ACTION_UPDATE_CONTACT_TAGS",
      parentId,
      configuration: {},
    }
    const response2 = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/automations/${automation.id}/steps`,
      body: stepData2,
    })

    expect(response2.status).toBe(422)
  })
})

describe.concurrent("@automations step validation", () => {
  test("validates TRIGGER subtype", async ({ expect }) => {
    const { user, audience } = await createUser()
    const automation = await seedAutomation(
      { audienceId: audience.id },
      false,
    )

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/automations/${automation.id}/steps`,
      body: {
        type: "TRIGGER",
        subtype: "INVALID_SUBTYPE",
        configuration: {},
      },
    })

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: expect.stringContaining(
            'Invalid type: Expected "TRIGGER_CONTACT_SUBSCRIBED" |',
          ),
          field: "subtype",
        },
      ],
    })
  })

  test("validates ACTION subtype", async ({ expect }) => {
    const { user, audience } = await createUser()
    const automation = await seedAutomation(
      { audienceId: audience.id },
      false,
    )

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/automations/${automation.id}/steps`,
      body: {
        type: "ACTION",
        subtype: "TRIGGER_CONTACT_SUBSCRIBED",
        configuration: {},
      },
    })

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: expect.stringContaining(
            "The subtype must be valid for the type action.",
          ),
        },
      ],
    })
  })

  test("validates RULE subtype", async ({ expect }) => {
    const { user, audience } = await createUser()
    const automation = await seedAutomation(
      { audienceId: audience.id },
      false,
    )

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/automations/${automation.id}/steps`,
      body: {
        type: "RULE",
        subtype: "TRIGGER_CONTACT_SUBSCRIBED",
        configuration: {},
      },
    })

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: expect.stringContaining(
            "The subtype must be valid for the type rule.",
          ),
        },
      ],
    })
  })

  test("validates END subtype", async ({ expect }) => {
    const { user, audience } = await createUser()
    const automation = await seedAutomation(
      { audienceId: audience.id },
      false,
    )

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/automations/${automation.id}/steps`,
      body: {
        type: "END",
        subtype: "TRIGGER_CONTACT_SUBSCRIBED",
        configuration: {},
      },
    })

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: expect.stringContaining(
            "The subtype must be valid for the type END.",
          ),
        },
      ],
    })
  })

  test("validates ACTION_SEND_EMAIL configuration", async ({ expect }) => {
    const { user, audience } = await createUser()
    const automation = await seedAutomation(
      { audienceId: audience.id },
      false,
    )

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/automations/${automation.id}/steps`,
      body: {
        type: "ACTION",
        subtype: "ACTION_SEND_EMAIL",
        configuration: {},
        emailId: cuid(),
      },
    })

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: expect.stringContaining("Invalid input: Received"),
          field: "emailId",
        },
      ],
    })
  })

  test("validates ACTION_ADD_TAG configuration", async ({ expect }) => {
    const { user, audience } = await createUser()
    const automation = await seedAutomation(
      { audienceId: audience.id },
      false,
    )

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/automations/${automation.id}/steps`,
      body: {
        type: "ACTION",
        subtype: "ACTION_ADD_TAG",
        configuration: {},
        tagId: cuid(),
      },
    })

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: expect.stringContaining("Invalid input: Received"),
          field: "tagId",
        },
      ],
    })
  })

  test("validates ACTION_SUBSCRIBE_TO_AUDIENCE configuration", async ({
    expect,
  }) => {
    const { user, audience } = await createUser()
    const automation = await seedAutomation(
      { audienceId: audience.id },
      false,
    )

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/automations/${automation.id}/steps`,
      body: {
        type: "ACTION",
        subtype: "ACTION_SUBSCRIBE_TO_AUDIENCE",
        configuration: {},
        audienceId: cuid(),
      },
    })

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      errors: [
        {
          message: expect.stringContaining("Invalid input: Received"),
          field: "audienceId",
        },
      ],
    })
  })

  test("validates ACTION_UPDATE_CONTACT_ATTRIBUTES configuration", async ({
    expect,
  }) => {
    const { user, audience } = await createUser()
    const automation = await seedAutomation(
      { audienceId: audience.id },
      false,
    )

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/automations/${automation.id}/steps`,
      body: {
        type: "ACTION",
        subtype: "ACTION_UPDATE_CONTACT_ATTRIBUTES",
        configuration: {
          invalidKey: {},
        },
      },
    })

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      message: "Validation failed.",
      errors: [
        {
          message:
            "The configuration object is malformed for ACTION_UPDATE_CONTACT_ATTRIBUTES.",
        },
      ],
    })
  })

  test("validates RULE_IF_ELSE configuration", async ({ expect }) => {
    const { user, audience } = await createUser()
    const automation = await seedAutomation(
      { audienceId: audience.id },
      false,
    )

    const response = await makeRequestAsUser(user, {
      method: "POST",
      path: `/audiences/${audience.id}/automations/${automation.id}/steps`,
      body: {
        type: "RULE",
        subtype: "RULE_IF_ELSE",
        configuration: {
          conditions: [
            {
              field: "invalidField",
              operator: "INVALID_OPERATOR",
              value: "test",
            },
          ],
        },
      },
    })

    expect(response.status).toBe(422)
    expect(await response.json()).toMatchObject({
      message: "Validation failed.",
      errors: [
        {
          message:
            "The configuration object for RULE_IF_ELSE is malformed.",
        },
      ],
    })
  })
})

describe.concurrent("@automations run", () => {
  test("can run all automation actions for an automation", async ({
    expect,
  }) => {
    //
  })
})
