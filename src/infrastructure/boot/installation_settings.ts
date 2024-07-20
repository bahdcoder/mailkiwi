import { inject, injectable } from "tsyringe"
import { z } from "zod"

import { ContainerKey } from "@/infrastructure/container.js"
import { DrizzleClient } from "@/infrastructure/database/client.ts"

@injectable()
export class InstallationSettings {
  protected settingsSchema = z.object({
    domain: z.string().url(),
  })

  constructor(@inject(ContainerKey.database) private database: DrizzleClient) {}

  async ensureInstallationSettings() {
    const setting = await this.database.query.settings.findFirst({})

    if (setting) {
      return true
    }

    throw new Error("Please seed setting into database before proceeding.")
  }
}
