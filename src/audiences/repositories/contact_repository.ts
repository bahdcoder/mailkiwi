import { and, eq, inArray } from "drizzle-orm"

import type { CreateContactDto } from "@/audiences/dto/contacts/create_contact_dto.js"

import type { DrizzleClient } from "@/database/client.js"
import type { UpdateSetContactInput } from "@/database/schema/database_schema_types.js"
import { contacts, tagsOnContacts } from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class ContactRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  findById(contactId: string) {
    return this.database.query.contacts.findFirst({
      where: eq(contacts.id, contactId),
    })
  }

  async createContact(payload: CreateContactDto, audienceId: string) {
    const id = this.cuid()
    await this.database
      .insert(contacts)
      .values({ ...payload, id, audienceId })

    return { id }
  }

  async update(
    contactId: string,
    updatedContact: Partial<UpdateSetContactInput>,
  ) {
    await this.database
      .update(contacts)
      .set(updatedContact)
      .where(eq(contacts.id, contactId))

    // if new attributes found, sync them to the audience

    return { id: contactId }
  }

  async attachTags(contactId: string, tagIds: string[]) {
    const existingTags = await this.database.query.tagsOnContacts.findMany(
      {
        where: eq(tagsOnContacts.contactId, contactId),
      },
    )

    const existingTagIds = existingTags.map((t) => t.tagId)

    const newTagIds = tagIds.filter((id) => !existingTagIds.includes(id))

    if (newTagIds.length > 0) {
      await this.database.insert(tagsOnContacts).values(
        newTagIds.map((tagId) => ({
          contactId,
          tagId,
          assignedAt: new Date(),
        })),
      )
    }

    return { id: contactId }
  }

  async detachTags(contactId: string, tagIds: string[]) {
    await this.database
      .delete(tagsOnContacts)
      .where(
        and(
          eq(tagsOnContacts.contactId, contactId),
          inArray(tagsOnContacts.tagId, tagIds),
        ),
      )

    return { id: contactId }
  }
}
