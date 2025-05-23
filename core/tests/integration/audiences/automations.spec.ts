import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { describe, test } from 'vitest'

import { AutomationRepository } from '#root/core/automations/repositories/automation_repository.js'

import { createUser } from '#root/core/tests/mocks/auth/users.js'
import { seedAutomation } from '#root/core/tests/mocks/teams/teams.js'
import { makeRequestAsUser } from '#root/core/tests/utils/http.js'

import {
  audiences,
  automationSteps,
  automations,
  emails,
  tags,
} from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'

import { AutomationStepRepository } from '#root/core/automations/repositories/automation_step_repository.js'
import type { AutomationStep } from '#root/database/database_schema_types.js'
import { container } from '#root/core/utils/typi.js'

describe('@automations', () => {
  test('experimenting with automations', async ({ expect }) => {
    const { audience } = await createUser()

    const automation = await seedAutomation({
      audienceId: audience.id,
      name: 'Book launch',
      description: 'Launch your book with these automated steps.',
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

    function createFlatAutomationTree(steps: AutomationStep[]): FlatTreeNode[] {
      const nodeMap: { [key: string]: FlatTreeNode } = {}

      // Create nodes for all steps
      for (const step of steps) {
        nodeMap[step.id] = { ...step }
      }

      function processNode(nodeId: string): FlatTreeNode[] {
        const node = nodeMap[nodeId]
        const result: FlatTreeNode[] = [node]

        if (node.subtype === 'RULE_IF_ELSE') {
          node.branches = {}

          for (const step of steps) {
            if (step.parentId === node.id) {
              const branchIndex = step.branchIndex !== null ? step.branchIndex : 0
              if (!node.branches?.[branchIndex]) {
                node.branches[branchIndex] = []
              }
              node.branches[branchIndex] = node.branches?.[branchIndex].concat(
                processNode(step.id),
              )
            }
          }
        } else {
          const children = steps.filter((step) => step.parentId === node.id)

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

    const tree = createFlatAutomationTree(automationFetch?.steps ?? []) as FlatTreeNode[]

    expect(
      tree[7]?.branches?.['1']?.[2]?.branches?.['1']?.[2]?.branches?.['1']?.[0]?.subtype,
    ).toEqual('ACTION_UNSUBSCRIBE_FROM_AUDIENCE')
  })

  test('can create an automation', async ({ expect }) => {
    const { user, audience } = await createUser()

    const database = makeDatabase()

    const payload = {
      name: faker.string.uuid(),
    }

    const response = await makeRequestAsUser(user, {
      body: payload,
      method: 'POST',
      path: `/audiences/${audience.id}/automations`,
    })

    const savedAutomation = await database.query.automations.findFirst({
      where: eq(automations.name, payload.name),
    })

    const json = await response.json()

    expect(savedAutomation).toBeDefined()
    expect(savedAutomation?.id).toEqual(json.payload.id)
  })

  test('can create ACTION_SEND_EMAIL automation step type', async ({ expect }) => {
    const { user, audience } = await createUser()
    const {
      id: automationId,
      triggerStepId,
      endStepId,
    } = await container.make(AutomationRepository).create(
      {
        name: faker.string.uuid(),
      },
      audience.id,
    )

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/audiences/${audience.id}/automations/${automationId}/steps`,
      body: {
        type: 'ACTION',
        subtype: 'ACTION_SEND_EMAIL',
        parentId: triggerStepId,
        targetId: endStepId,
      },
    })

    const json = await response.json()
    expect(response.status).toBe(201)

    expect(json.payload.step).toBeDefined()
    expect(json.payload.automation).toBeDefined()
  })

  test('can create ACTION_ADD_TAG automation step type', async ({ expect }) => {
    const { user, audience } = await createUser()
    const {
      id: automationId,
      triggerStepId,
      endStepId,
    } = await container.make(AutomationRepository).create(
      {
        name: faker.string.uuid(),
      },
      audience.id,
    )

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/audiences/${audience.id}/automations/${automationId}/steps`,
      body: {
        type: 'ACTION',
        subtype: 'ACTION_ADD_TAG',
        parentId: triggerStepId,
        targetId: endStepId,
      },
    })

    const json = await response.json()
    expect(response.status).toBe(201)

    expect(json.payload.step).toBeDefined()
    expect(json.payload.automation).toBeDefined()
  })

  test('can create ACTION_SUBSCRIBE_TO_AUDIENCE automation step type', async ({
    expect,
  }) => {
    const { user, audience } = await createUser()
    const {
      id: automationId,
      triggerStepId,
      endStepId,
    } = await container.make(AutomationRepository).create(
      {
        name: faker.string.uuid(),
      },
      audience.id,
    )
    const database = makeDatabase()

    const audienceId = cuid()

    await database.insert(audiences).values({
      id: audienceId,
      name: faker.lorem.word(),
      teamId: user?.teams?.[0]?.id,
    })

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/audiences/${audience.id}/automations/${automationId}/steps`,
      body: {
        type: 'ACTION',
        subtype: 'ACTION_SUBSCRIBE_TO_AUDIENCE',
        configuration: {},
        audienceId,
        parentId: triggerStepId,
        targetId: endStepId,
      },
    })

    const json = await response.json()

    expect(response.status).toBe(201)
    const createdStep = await database.query.automationSteps.findFirst({
      where: eq(automationSteps.id, json.payload.step.id),
    })
    expect(createdStep?.type).toBe('ACTION')
    expect(createdStep?.subtype).toBe('ACTION_SUBSCRIBE_TO_AUDIENCE')
    expect(createdStep?.audienceId).toBe(audienceId)
  })
})

describe('@automations steps', () => {
  test('cannot create an automation step with an invalid parent Id', async ({
    expect,
  }) => {
    const { user, audience } = await createUser()
    const automation = await seedAutomation({ audienceId: audience.id }, false)

    const stepData = {
      type: 'TRIGGER',
      subtype: 'TRIGGER_CONTACT_SUBSCRIBED',
      parentId: faker.string.uuid(), // Invalid parent ID
      configuration: {},
    }

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/audiences/${audience.id}/automations/${automation.id}/steps`,
      body: stepData,
    })

    const json = await response.json()

    expect(response.status).toBe(422)

    const parentIdError = json.payload.errors.some(
      (error: { field: string }) => error.field === 'parentId',
    )
    expect(parentIdError).toBeTruthy()
  })
})

describe('@automations step validation', () => {
  test('validates TRIGGER subtype', async ({ expect }) => {
    const { user, audience } = await createUser()
    const {
      id: automationId,
      triggerStepId,
      endStepId,
    } = await container.make(AutomationRepository).create(
      {
        name: faker.string.uuid(),
      },
      audience.id,
    )
    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/audiences/${audience.id}/automations/${automationId}/steps`,
      body: {
        type: 'TRIGGER',
        subtype: 'INVALID_SUBTYPE',
        configuration: {},
        parentId: triggerStepId,
        targetId: endStepId,
      },
    })

    const json = await response.json()

    expect(response.status).toBe(422)
    expect(json.payload).toMatchObject({
      errors: [
        {
          message: expect.stringContaining('Invalid type: Expected "TRIGGER_EMPTY" |'),
          field: 'subtype',
        },
      ],
    })
  })

  test('validates ACTION subtype', async ({ expect }) => {
    const { user, audience } = await createUser()
    const {
      id: automationId,
      triggerStepId: parentId,
      endStepId: targetId,
    } = await container.make(AutomationRepository).create(
      {
        name: faker.string.uuid(),
      },
      audience.id,
    )
    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/audiences/${audience.id}/automations/${automationId}/steps`,
      body: {
        type: 'ACTION',
        subtype: 'TRIGGER_CONTACT_SUBSCRIBED',
        configuration: {},
        parentId,
        targetId,
      },
    })

    const json = await response.json()

    expect(response.status).toBe(422)
    expect(json.payload).toMatchObject({
      errors: [
        {
          message: expect.stringContaining('The subtype must be valid for the type.'),
        },
      ],
    })
  })

  test('validates RULE subtype', async ({ expect }) => {
    const { user, audience } = await createUser()
    const {
      id: automationId,
      triggerStepId: parentId,
      endStepId: targetId,
    } = await container.make(AutomationRepository).create(
      {
        name: faker.string.uuid(),
      },
      audience.id,
    )

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/audiences/${audience.id}/automations/${automationId}/steps`,
      body: {
        type: 'RULE',
        subtype: 'TRIGGER_CONTACT_SUBSCRIBED',
        configuration: {},
        parentId,
        targetId,
      },
    })

    const json = await response.json()

    expect(response.status).toBe(422)
    expect(json.payload).toMatchObject({
      errors: [
        {
          message: expect.stringContaining('The subtype must be valid for the type.'),
        },
      ],
    })
  })

  test('validates ACTION_SEND_EMAIL configuration', async ({ expect }) => {
    const { user, audience } = await createUser()
    const {
      id: automationId,
      triggerStepId: parentId,
      endStepId: targetId,
    } = await container.make(AutomationRepository).create(
      {
        name: faker.string.uuid(),
      },
      audience.id,
    )

    const { id: automationStepId } = await container
      .make(AutomationStepRepository)
      .create(automationId, {
        type: 'ACTION',
        subtype: 'ACTION_SEND_EMAIL',
        configuration: {},
        parentId,
        targetId,
      })

    const response = await makeRequestAsUser(user, {
      method: 'PATCH',
      path: `/audiences/${audience.id}/automations/${automationId}/steps/${automationStepId}/configuration`,
      body: {
        configuration: {},
        emailId: cuid(),
      },
    })

    const json = await response.json()

    expect(response.status).toBe(422)
    expect(json.payload).toMatchObject({
      errors: [
        {
          message: 'The emailId must reference a valid email.',
          field: 'emailId',
        },
      ],
    })
  })

  test('validates ACTION_ADD_TAG configuration', async ({ expect }) => {
    const { user, audience } = await createUser()
    const {
      id: automationId,
      triggerStepId: parentId,
      endStepId: targetId,
    } = await container.make(AutomationRepository).create(
      {
        name: faker.string.uuid(),
      },
      audience.id,
    )

    const { id: automationStepId } = await container
      .make(AutomationStepRepository)
      .create(automationId, {
        type: 'ACTION',
        subtype: 'ACTION_ADD_TAG',
        configuration: {},
        parentId,
        targetId,
      })

    const response = await makeRequestAsUser(user, {
      method: 'PATCH',
      path: `/audiences/${audience.id}/automations/${automationId}/steps/${automationStepId}/configuration`,
      body: {
        configuration: {},
        tagId: cuid(),
      },
    })

    const json = await response.json()

    expect(response.status).toBe(422)
    expect(json.payload).toMatchObject({
      errors: [
        {
          message: 'The tagId must reference a valid tag.',
          field: 'tagId',
        },
      ],
    })
  })

  test('validates ACTION_REMOVE_TAG configuration', async ({ expect }) => {
    const { user, audience } = await createUser()
    const {
      id: automationId,
      triggerStepId: parentId,
      endStepId: targetId,
    } = await container.make(AutomationRepository).create(
      {
        name: faker.string.uuid(),
      },
      audience.id,
    )

    const { id: automationStepId } = await container
      .make(AutomationStepRepository)
      .create(automationId, {
        type: 'ACTION',
        subtype: 'ACTION_REMOVE_TAG',
        configuration: {},
        parentId,
        targetId,
      })

    const response = await makeRequestAsUser(user, {
      method: 'PATCH',
      path: `/audiences/${audience.id}/automations/${automationId}/steps/${automationStepId}/configuration`,
      body: {
        configuration: {},
        tagId: cuid(),
      },
    })

    const json = await response.json()

    expect(response.status).toBe(422)
    expect(json.payload).toMatchObject({
      errors: [
        {
          message: 'The tagId must reference a valid tag.',
          field: 'tagId',
        },
      ],
    })
  })

  test('validates RULE_IF_ELSE configuration', async ({ expect }) => {
    const { user, audience } = await createUser()
    const {
      id: automationId,
      triggerStepId: parentId,
      endStepId: targetId,
    } = await container.make(AutomationRepository).create(
      {
        name: faker.string.uuid(),
      },
      audience.id,
    )

    const { id: automationStepId } = await container
      .make(AutomationStepRepository)
      .create(automationId, {
        type: 'RULE',
        subtype: 'RULE_IF_ELSE',
        configuration: {
          filterGroups: {
            type: 'AND',
            groups: [],
          },
        },
        parentId,
        targetId,
      })

    const ifElseConfiguration = {
      filterGroups: {
        type: 'AND',
        groups: [
          {
            type: 'AND',
            conditions: [
              {
                field: 'email',
                operation: 'endsWith',
                value: '@gmail.com',
              },
            ],
          },
        ],
      },
    }

    const response = await makeRequestAsUser(user, {
      method: 'PATCH',
      path: `/audiences/${audience.id}/automations/${automationId}/steps/${automationStepId}/configuration`,
      body: {
        configuration: ifElseConfiguration,
      },
    })

    const json = await response.json()

    const step = json.payload.automation.steps.find(
      (step: AutomationStep) => step.subtype === 'RULE_IF_ELSE',
    )

    expect(response.status).toBe(200)
    expect(step?.configuration).toMatchObject(ifElseConfiguration)
  })
})

// TODO: Implement automation run tests
describe('@automations run', () => {
  test.todo('can run all automation actions for an automation')
})
