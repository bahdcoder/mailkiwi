import { eq } from "drizzle-orm"

import type { DrizzleClient } from "@/database/client.js"
import type {
  InsertContactImport,
  UpdateContactImport,
} from "@/database/schema/database_schema_types.js"
import { contactImports } from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class ContactImportRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async create(payload: InsertContactImport) {
    const result = await this.database
      .insert(contactImports)
      .values({ ...payload })

    return { id: this.primaryKey(result) }
  }

  async update(contactImportId: number, payload: UpdateContactImport) {
    await this.database
      .update(contactImports)
      .set(payload)
      .where(eq(contactImports.id, contactImportId))
  }

  async findById(importId: number) {
    const [contactImport] = await this.database
      .select()
      .from(contactImports)
      .where(eq(contactImports.id, importId))

    return contactImport
  }
}
