import { and, eq, inArray, or } from "drizzle-orm"
import { MySqlInsertOnDuplicateKeyUpdateConfig } from "drizzle-orm/mysql-core"

import type { CreateContactDto } from "@/audiences/dto/contacts/create_contact_dto.js"

import type { DrizzleClient } from "@/database/client.js"
import type {
  InsertContact,
  UpdateSetContactInput,
} from "@/database/schema/database_schema_types.js"
import { contacts, tagsOnContacts } from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class ContactRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  findById(contactId: number) {
    return this.database.query.contacts.findFirst({
      where: eq(contacts.id, contactId),
    })
  }

  async create(payload: CreateContactDto, audienceId: number) {
    const result = await this.database
      .insert(contacts)
      .values({ ...payload, audienceId })

    return { id: this.primaryKey(result) }
  }

  async bulkCreate(
    contactsToCreate: InsertContact[],
    onDuplicateKeyUpdate: MySqlInsertOnDuplicateKeyUpdateConfig<any>,
  ) {
    await this.database
      .insert(contacts)
      .values(contactsToCreate)
      .onDuplicateKeyUpdate(onDuplicateKeyUpdate)

    const contactIds = await this.database
      .select({
        email: contacts.email,
        audienceId: contacts.audienceId,
        id: contacts.id,
      })
      .from(contacts)
      .where(
        or(
          ...contactsToCreate.map((contactToCreate) =>
            and(
              eq(contacts.email, contactToCreate.email),
              eq(
                contacts.audienceId,
                contactToCreate.audienceId as number,
              ),
            ),
          ),
        ),
      )

    const contactIdsMap = new Map(
      contactIds.map((contact) => [
        `${contact.email}-${contact.audienceId}`,
        contact.id,
      ]),
    )

    return contactsToCreate.map((contactToCreate) => ({
      ...contactToCreate,
      id: contactIdsMap.get(
        `${contactToCreate.email}-${contactToCreate.audienceId}`,
      ) as number,
    }))
  }

  async update(
    contactId: number,
    updatedContact: Partial<UpdateSetContactInput>,
  ) {
    await this.database
      .update(contacts)
      .set(updatedContact)
      .where(eq(contacts.id, contactId))

    // TODO: if new attributes found, sync them to the audience

    return { id: contactId }
  }

  async attachTags(contactId: number, tagIds: number[]) {
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

  async detachTags(contactId: number, tagIds: number[]) {
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
