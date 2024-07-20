import { faker } from "@faker-js/faker"
import { eq } from "drizzle-orm"
import { describe, test } from "vitest"

import { makeDatabase } from "@/infrastructure/container.js"
import { automations } from "@/infrastructure/database/schema/schema.ts"
import { createUser } from "@/tests/mocks/auth/users.js"
import { refreshDatabase, seedAutomation } from "@/tests/mocks/teams/teams.ts"
import { makeRequestAsUser } from "@/tests/utils/http.ts"

describe("Contact automations", () => {
  test("experimenting with automations", async ({ expect }) => {
    await refreshDatabase()
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

    function createFlatAutomationTree(steps: AutomationStep[]): FlatTreeNode[] {
      const nodeMap: { [key: string]: FlatTreeNode } = {}

      // Create nodes for all steps
      steps.forEach((step) => {
        nodeMap[step.id] = { ...step }
      })

      function processNode(nodeId: string): FlatTreeNode[] {
        const node = nodeMap[nodeId]
        const result: FlatTreeNode[] = [node]

        if (node.subtype === "RULE_IF_ELSE") {
          node.branches = {}
          steps.forEach((step) => {
            if (step.parentId === node.id) {
              const branchIndex =
                step.branchIndex !== null ? step.branchIndex : 0
              if (!node.branches![branchIndex]) {
                node.branches![branchIndex] = []
              }
              node.branches![branchIndex] = node.branches![branchIndex].concat(
                processNode(step.id),
              )
            }
          })
        } else {
          const children = steps.filter((step) => step.parentId === node.id)
          children.forEach((child) => {
            result.push(...processNode(child.id))
          })
        }

        return result
      }

      const rootNodes = steps.filter((step) => step.parentId === null)
      let flatTree: FlatTreeNode[] = []
      rootNodes.forEach((rootNode) => {
        flatTree = flatTree.concat(processNode(rootNode.id))
      })

      return flatTree
    }

    const automationFetch = await database.query.automations.findFirst({
      where: eq(automations.id, automation.id),
      with: {
        steps: true,
      },
    })

    const tree = createFlatAutomationTree(
      automationFetch?.steps ?? [],
    ) as FlatTreeNode[]

    expect(
      tree[5]?.branches?.["1"]?.[2]?.branches?.["1"]?.[2]?.branches?.[
        "1"
      ]?.[0]?.["subtype"],
    ).toEqual("ACTION_UNSUBSCRIBE_FROM_AUDIENCE")
  })

  test("can create an automation", async ({ expect }) => {
    await refreshDatabase()
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
})
