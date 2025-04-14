import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { describe, test } from 'vitest'

import { AutomationRepository } from '@/automations/repositories/automation_repository.js'
import { AutomationStepRepository } from '@/automations/repositories/automation_step_repository.js'
import type { CreateAutomationStepDto } from '@/automations/dto/create_automation_step_dto.js'

import { createUser } from '@/tests/mocks/auth/users.js'

import { automationSteps } from '@/database/schema.js'

import { makeDatabase } from '@/shared/container/index.js'
import { cuid } from '@/shared/utils/cuid/cuid.js'

import { container } from '@/utils/typi.js'

describe('@automation-step-repository', () => {
  test('creates a standard automation step', async ({ expect }) => {
    const { audience } = await createUser()
    const {
      id: automationId,
      triggerStepId,
      endStepId,
    } = await container.make(AutomationRepository).create(
      {
        name: faker.lorem.words(2),
      },
      audience.id,
    )
    const database = makeDatabase()

    const repository = new AutomationStepRepository()

    const data = {
      type: 'ACTION' as const,
      subtype: 'ACTION_SEND_EMAIL' as const,
      configuration: { emailId: cuid() },
      parentId: triggerStepId,
      targetId: endStepId,
    } satisfies CreateAutomationStepDto

    const result = await repository.create(automationId, data)

    expect(result.id).toBeDefined()

    const createdStep = await database.query.automationSteps.findFirst({
      where: eq(automationSteps.id, result.id),
    })

    expect(createdStep).toBeDefined()
    expect(createdStep?.type).toBe('ACTION')
    expect(createdStep?.subtype).toBe('ACTION_SEND_EMAIL')
    expect(createdStep?.automationId).toBe(automationId)
  })

  test('creates an IF/ELSE rule step with branches', async ({ expect }) => {
    const { audience } = await createUser()
    const {
      id: automationId,
      triggerStepId,
      endStepId,
    } = await container.make(AutomationRepository).create(
      {
        name: faker.lorem.words(2),
      },
      audience.id,
    )
    const database = makeDatabase()

    const repository = new AutomationStepRepository()

    const data = {
      type: 'RULE' as const,
      subtype: 'RULE_IF_ELSE' as const,
      parentId: triggerStepId,
      targetId: endStepId,
      configuration: {
        filterGroups: {
          type: 'AND',
          groups: [
            {
              type: 'AND',
              conditions: [
                {
                  field: 'email',
                  operation: 'endsWith',
                  value: ['@gmail.com'],
                },
              ],
            },
          ],
        },
      },
    } satisfies CreateAutomationStepDto

    const result = await repository.createIfElseStep(automationId, data, endStepId)

    expect(result.id).toBeDefined()
    expect(result.yesBranchStepId).toBeDefined()
    expect(result.noBranchStepId).toBeDefined()
    expect(result.noEndStepId).toBeDefined()

    // Verify the IF/ELSE step was created correctly
    const ifElseStep = await database.query.automationSteps.findFirst({
      where: eq(automationSteps.id, result.id),
    })

    expect(ifElseStep).toBeDefined()
    expect(ifElseStep?.type).toBe('RULE')
    expect(ifElseStep?.subtype).toBe('RULE_IF_ELSE')
    expect(ifElseStep?.parentId).toBe(data.parentId)

    // Verify the YES branch step was created correctly
    const yesBranchStep = await database.query.automationSteps.findFirst({
      where: eq(automationSteps.id, result.yesBranchStepId),
    })

    expect(yesBranchStep).toBeDefined()
    expect(yesBranchStep?.type).toBe('ACTION')
    expect(yesBranchStep?.parentId).toBe(result.id)
    expect(yesBranchStep?.branchIndex).toBe(0) // YES branch

    // Verify the target step was updated to have the YES branch step as its parent
    const targetStep = await database.query.automationSteps.findFirst({
      where: eq(automationSteps.id, endStepId),
    })

    expect(targetStep?.parentId).toBe(result.yesBranchStepId)

    // Verify the NO branch step was created correctly
    const noBranchStep = await database.query.automationSteps.findFirst({
      where: eq(automationSteps.id, result.noBranchStepId),
    })

    expect(noBranchStep).toBeDefined()
    expect(noBranchStep?.type).toBe('ACTION')
    expect(noBranchStep?.parentId).toBe(result.id)
    expect(noBranchStep?.branchIndex).toBe(1) // NO branch

    // Verify the NO branch end step was created correctly
    const noEndStep = await database.query.automationSteps.findFirst({
      where: eq(automationSteps.id, result.noEndStepId),
    })

    expect(noEndStep).toBeDefined()
    expect(noEndStep?.type).toBe('END')
    expect(noEndStep?.subtype).toBe('END')
    expect(noEndStep?.parentId).toBe(result.noBranchStepId)
  })
})
