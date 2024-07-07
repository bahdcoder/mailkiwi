import { inject, injectable } from "tsyringe"

import { BaseRepository } from "@/domains/shared/repositories/base_repository.ts"
import { ContainerKey } from "@/infrastructure/container.js"
import { DrizzleClient } from "@/infrastructure/database/client.ts"
import { contacts } from "@/infrastructure/database/schema/schema.ts"

import { CreateContactDto } from "../dto/contacts/create_contact_dto.js"

@injectable()
export class ContactRepository extends BaseRepository {
  constructor(
    @inject(ContainerKey.database) protected database: DrizzleClient,
  ) {
    super()
  }

  async createContact(payload: CreateContactDto) {
    const id = this.cuid()
    await this.database.insert(contacts).values(payload)

    return { id }
  }
}
