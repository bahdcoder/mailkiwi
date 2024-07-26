import { BaseRepository } from '@/domains/shared/repositories/base_repository.js'
import { makeDatabase } from '@/infrastructure/container.js'
import type { DrizzleClient } from '@/infrastructure/database/client.js'
import {
  contacts,
  tagsOnContacts,
} from '@/infrastructure/database/schema/schema.js'

import type { UpdateSetContactInput } from '@/infrastructure/database/schema/types.ts'
import { and, eq, inArray } from 'drizzle-orm'
import type { CreateContactDto } from '../dto/contacts/create_contact_dto.js'

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
    await this.database.insert(contacts).values({ ...payload, id, audienceId })

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

    return { id: contactId }
  }

  async attachTags(contactId: string, tagIds: string[]) {
    const existingTags = await this.database.query.tagsOnContacts.findMany({
      where: eq(tagsOnContacts.contactId, contactId),
    })

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
