import { PrismaClient } from "@prisma/client"
import inquirer from "inquirer"
import { inject, injectable } from "tsyringe"
import { z } from "zod"

import { ContainerKey } from "@/infrastructure/container.js"

@injectable()
export class InstallationSettings {
  protected settingsSchema = z.object({
    domain: z.string().url(),
  })

  constructor(@inject(ContainerKey.database) private database: PrismaClient) {}

  async ensureInstallationSettings() {
    const setting = await this.database.setting.findFirst()

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

    await this.database.setting.create({
      data: {
        domain,
        url: `https://${domain}`,
      },
    })

    return true
  }
}
