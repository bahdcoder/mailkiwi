import { SQL, and, eq, inArray } from "drizzle-orm"
import { MySqlInsertOnDuplicateKeyUpdateConfig } from "drizzle-orm/mysql-core"
import { DateTime } from "luxon"

import type { CreateContactDto } from "@/audiences/dto/contacts/create_contact_dto.js"
import { UpdateContactDto } from "@/audiences/dto/contacts/update_contact_dto.js"

import { TriggerAutomationsForContactJob } from "@/automations/jobs/trigger_automation_for_contact_job.js"

import type { DrizzleClient } from "@/database/client.js"
import type {
  Contact,
  ContactProperty,
  ContactWithProperties,
  ContactWithTags,
  InsertContact,
  UpdateSetAudienceInput,
  UpdateSetContactInput,
} from "@/database/database_schema_types.js"
import {
  audiences,
  automationStepSubtypesTriggerMap,
  contactProperties,
  contacts,
  emailSendEvents,
  tags,
  tagsOnContacts,
} from "@/database/schema.js"
import { hasMany } from "@/database/utils/relationships.js"

import { makeDatabase } from "@/shared/container/index.js"
import { Queue } from "@/shared/queue/queue.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"
import { guessValueType } from "@/shared/utils/helpers/guess_value_type.js"
import { Paginator } from "@/shared/utils/pagination/paginator.js"

import { container } from "@/utils/typi.js"

export class ContactRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  protected hasManyProperties = hasMany(this.database, {
    from: contacts,
    to: contactProperties,
    foreignKey: contactProperties.contactId,
    primaryKey: contacts.id,
    relationName: "properties",
  })

  async findByEmailForTeam(email: string, teamId: string) {
    const [website] = await this.database
      .select({
        id: contacts.id,
        email: contacts.email,
        lastName: contacts.lastName,
        firstName: contacts.firstName,
      })
      .from(contacts)
      .leftJoin(audiences, eq(contacts.audienceId, audiences.id))
      .where(and(eq(contacts.email, email), eq(audiences.teamId, teamId)))

    return website
  }

  async findById(contactId: string) {
    const [contact] = await this.hasManyProperties((query) =>
      query.where(eq(contacts.id, contactId)),
    )

    return contact
  }

  async getActivity(contactId: string) {
    return new Paginator(emailSendEvents)
      .queryConditions([and(eq(emailSendEvents.contactId, contactId))])
      .size(10)
      .page(1)
      .paginate()
  }

  getContactPropertiesFromPayloadProperties(
    contactId: string,
    audienceId: string,
    properties: UpdateContactDto["properties"] = {},
  ) {
    const contactPropertiesPayload: ContactProperty[] = []

    Object.keys(properties).forEach(function (property) {
      const value = properties[property]

      const type = guessValueType(value)

      contactPropertiesPayload.push({
        [type]:
          type === "date"
            ? DateTime.fromISO(value as string).toJSDate()
            : value,
        name: property,
        contactId,
        audienceId,
      } as ContactProperty)
    })

    return { contactPropertiesPayload }
  }

  async create(payload: CreateContactDto, audienceId: string) {
    const id = this.cuid()

    const properties = payload.properties ?? {}

    const { contactPropertiesPayload } =
      this.getContactPropertiesFromPayloadProperties(
        id,
        audienceId,
        properties,
      )

    await this.database.transaction(async (trx) => {
      await trx.insert(contacts).values({
        ...payload,
        id,
        audienceId,
      })

      if (contactPropertiesPayload.length > 0) {
        await trx
          .insert(contactProperties)
          .values(contactPropertiesPayload)
      }
    })

    return { id }
  }

  async bulkCreate(
    contactsToCreate: InsertContact[],
    onDuplicateKeyUpdate: MySqlInsertOnDuplicateKeyUpdateConfig<any>,
  ) {
    await this.database
      .insert(contacts)
      .values(contactsToCreate)
      .onDuplicateKeyUpdate(onDuplicateKeyUpdate)

    return contactsToCreate as Contact[]
  }

  async updateById(
    contactId: string,
    updatedContact: Partial<UpdateSetContactInput>,
  ) {
    await this.database
      .update(contacts)
      .set(updatedContact)
      .where(eq(contacts.id, contactId))
  }

  async update(
    contact: ContactWithProperties,
    updatedContact: Partial<UpdateContactDto>,
  ) {
    const { properties, ...restOfContactDetails } = updatedContact

    const { contactPropertiesPayload } =
      this.getContactPropertiesFromPayloadProperties(
        contact.id,
        contact.audienceId,
        properties,
      )

    const existingPropertyNames = contact.properties.map(
      (contactProperty) => contactProperty.name,
    )

    const propertiesToCreate = contactPropertiesPayload.filter(
      (property) => !existingPropertyNames.includes(property.name),
    )

    const propertiesToUpdate = contactPropertiesPayload
      .filter((property) => existingPropertyNames.includes(property.name))
      .map((property) => ({
        ...property,
        id: contact.properties.find(
          (contactProperty) => contactProperty.name === property.name,
        )?.id,
      }))

    await this.database.transaction(async (trx) => {
      for (const property of propertiesToUpdate) {
        const { id: propertyId, contactId, ...values } = property

        await trx
          .update(contactProperties)
          .set(values)
          .where(
            and(
              eq(contactProperties.id, propertyId as string),
              eq(contactProperties.contactId, contactId),
            ),
          )
      }

      for (const property of propertiesToCreate) {
        const { contactId, ...values } = property

        await trx
          .insert(contactProperties)
          .values({ ...values, contactId })
      }

      if (Object.keys(restOfContactDetails).length) {
        await trx
          .update(contacts)
          .set(restOfContactDetails)
          .where(eq(contacts.id, contact.id))
      }
    })

    return { id: contact.id }
  }

  async attachTags(contactId: string, tagIds: string[]) {
    const validTags = await this.database
      .select({ id: tags.id })
      .from(tags)
      .where(inArray(tags.id, tagIds))

    const tagsToAttach = validTags.map((tag) => tag.id)

    if (tagsToAttach.length === 0) {
      return { id: contactId }
    }

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

      await Queue.automations().add(TriggerAutomationsForContactJob.id, {
        trigger:
          automationStepSubtypesTriggerMap.TRIGGER_CONTACT_TAG_ADDED,
        contactId,
      })
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

  async findAllContactsWithTags(
    filters: SQL | undefined,
  ): Promise<ContactWithTags[]> {
    const contactsWithTags = await this.database
      .select()
      .from(contacts)
      .where(filters)
      .leftJoin(
        contactProperties,
        eq(contactProperties.contactId, contacts.id),
      )
      .leftJoin(tagsOnContacts, eq(tagsOnContacts.contactId, contacts.id))
      .leftJoin(tags, eq(tags.id, tagsOnContacts.tagId))

    const groupedContacts = contactsWithTags.reduce(
      (acc, row) => {
        const contactId = row.contacts.id
        if (!acc[contactId]) {
          acc[contactId] = {
            ...row.contacts,
            tags: [],
          }
        }
        if (row.tagsOnContacts && row.tags) {
          acc[contactId].tags.push({
            ...row.tagsOnContacts,
            tag: row.tags,
          })
        }
        return acc
      },
      {} as Record<string, any>,
    )

    return Object.values(groupedContacts)
  }
}
