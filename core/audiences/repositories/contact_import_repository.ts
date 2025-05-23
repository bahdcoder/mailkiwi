import { eq } from 'drizzle-orm'

import type { DrizzleClient } from '#root/database/client.js'
import type {
  InsertContactImport,
  UpdateContactImport,
} from '#root/database/database_schema_types.js'
import { contactImports } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'

export class ContactImportRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  static getUploadedFileKey(id: string, extension: string, teamId: string) {
    return `${teamId}/contact-imports/${id}.${extension}`
  }

  async create(payload: InsertContactImport) {
    const id = payload.id || this.cuid()
    await this.database.insert(contactImports).values({ id, ...payload })

    return { id }
  }

  async update(contactImportId: string, payload: UpdateContactImport) {
    await this.database
      .update(contactImports)
      .set(payload)
      .where(eq(contactImports.id, contactImportId))
  }

  async findById(importId: string) {
    const [contactImport] = await this.database
      .select()
      .from(contactImports)
      .where(eq(contactImports.id, importId))

    return contactImport
  }
}
