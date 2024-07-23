import { url, object, pipe, string } from 'valibot'

import { ContainerKey } from '@/infrastructure/container.js'
import type { DrizzleClient } from '@/infrastructure/database/client.js'
import { container } from '@/utils/typi.js'

export class InstallationSettings {
  protected settingsSchema = object({
    domain: pipe(string(), url()),
  })

  constructor(
    private database: DrizzleClient = container.make(ContainerKey.database),
  ) {}

  async ensureInstallationSettings() {
    const setting = await this.database.query.settings.findFirst({})

    if (setting) {
      return true
    }

    throw new Error('Please seed setting into database before proceeding.')
  }
}
