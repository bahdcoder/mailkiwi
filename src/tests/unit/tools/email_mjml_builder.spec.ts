import { EmailBuilderTool } from "@/emails/tools/email_builder/email_builder_tool.ts"
import { EmailSnapshotTool } from "@/emails/tools/email_snapshot/email_snapshot_tool.ts"
import Path from "node:path"
import prettier from "prettier"
import { describe, test } from "vitest"

import { getDefaultEmailContentSchema } from "@/tests/mocks/emails/email_content.ts"

describe("mjml template builder", () => {
  test("builds the default root without any sections", async ({
    expect,
  }) => {
    const mjml = new EmailBuilderTool(
      getDefaultEmailContentSchema(),
    ).build()
  })
})
