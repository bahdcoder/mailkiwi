import { BaseRepository } from "@/domains/shared/repositories/base_repository.js"
import { makeDatabase } from "@/infrastructure/container.js"
import { DrizzleClient } from "@/infrastructure/database/client.js"
import { contacts } from "@/infrastructure/database/schema/schema.js"

import { CreateContactDto } from "../dto/contacts/create_contact_dto.js"

export class ContactRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async createContact(payload: CreateContactDto) {
    const id = this.cuid()
    await this.database.insert(contacts).values(payload)

    return { id }
  }
}
