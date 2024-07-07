import inquirer from "inquirer"
import { inject, injectable } from "tsyringe"
import { z } from "zod"

import { ContainerKey } from "@/infrastructure/container.js"
import { DrizzleClient } from "@/infrastructure/database/client.ts"
import { settings } from "@/infrastructure/database/schema/schema.ts"

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

    const { domain } = await inquirer.prompt({
      type: "input",
      name: "domain",
      message:
        "What domain will your application live on? Example: newsletter.example.com",
      validate(value) {
        const { success } = z
          .string()
          .refine((value) =>
            /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,11}?$/.test(value),
          )
          .safeParse(value)

        return success
          ? true
          : "Please enter a valid domain url your application will live on."
      },
    })

    await this.database
      .insert(settings)
      .values({ domain, url: `https://${domain}` })

    return true
  }
}
