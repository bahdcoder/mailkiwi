import { z } from "zod"

import { ContainerKey } from "@/infrastructure/container.js"
import { DrizzleClient } from "@/infrastructure/database/client.ts"
import { container } from "@/utils/typi.ts"

export class InstallationSettings {
  protected settingsSchema = z.object({
    domain: z.string().url(),
  })

  constructor(
    private database: DrizzleClient = container.make(ContainerKey.database),
  ) {}

  async ensureInstallationSettings() {
    const setting = await this.database.query.settings.findFirst({})

    if (setting) {
      return true
    }

    throw new Error("Please seed setting into database before proceeding.")
  }
}
