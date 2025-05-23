import { makeS3Client } from '#root/core/minio/s3_client.js'
import CsvParser from 'csv-parser'
import { sql } from 'drizzle-orm'
import { DateTime } from 'luxon'

import { AudienceRepository } from '#root/core/audiences/repositories/audience_repository.js'
import { ContactImportRepository } from '#root/core/audiences/repositories/contact_import_repository.js'
import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'
import { TagRepository } from '#root/core/audiences/repositories/tag_repository.js'

import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import {
  ContactImport,
  type ContactProperty,
} from '#root/database/database_schema_types.js'
import {
  KnownAudienceProperty,
  contactProperties,
  contacts,
  tagsOnContacts,
} from '#root/database/schema.js'

import { BaseJob, type JobContext } from '#root/core/shared/queue/abstract_job.js'
import { AVAILABLE_QUEUES } from '#root/core/shared/queue/config.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'
import { guessValueType } from '#root/core/shared/utils/helpers/guess_value_type.js'

import { container } from '#root/core/utils/typi.js'

export interface ImportContactsJobPayload {
  contactImportId: string
}

/**
 * ImportContactsJob handles the asynchronous processing of contact CSV imports.
 *
 * This job is responsible for the critical task of importing contacts from CSV files
 * into the Kibamail platform. It implements a robust, scalable import process that:
 *
 * 1. Retrieves the CSV file from cloud storage
 * 2. Parses the CSV data and maps columns to contact fields
 * 3. Creates new contacts and updates existing ones based on configuration
 * 4. Handles custom properties and tags for imported contacts
 * 5. Processes imports in batches to handle large files efficiently
 *
 * The job uses database transactions to ensure data consistency, with proper error
 * handling and rollback capabilities. It's designed to handle large imports efficiently
 * through batched processing and optimized database operations.
 */
export class ImportContactsJob extends BaseJob<ImportContactsJobPayload> {
  static get id() {
    return 'ACCOUNTS::CONTACTS'
  }

  static get queue() {
    return AVAILABLE_QUEUES.contacts
  }

  /**
   * Processes a contact import job.
   *
   * This method implements the main import workflow:
   * 1. Retrieves the import configuration and validates prerequisites
   * 2. Fetches the CSV file from cloud storage
   * 3. Parses the CSV data into rows
   * 4. Processes the contacts in batches within a transaction
   *
   * The method includes validation steps to ensure that the import configuration
   * and related entities (audience, team) exist before proceeding with the import.
   * It uses streaming for CSV parsing to efficiently handle files of any size.
   *
   * @param context - The job context containing database, payload, and logger
   * @returns Job completion status
   */
  async handle({ database, payload, logger }: JobContext<ImportContactsJobPayload>) {
    // Retrieve the import configuration
    const contactImport = await container
      .make(ContactImportRepository)
      .findById(payload.contactImportId)

    // Validate that the import configuration exists
    if (!contactImport) {
      logger.info(`Contact import with ID ${payload.contactImportId} does not exist.`)
      return this.done()
    }

    // Retrieve the audience for the import
    const audience = await container
      .make(AudienceRepository)
      .findById(contactImport?.audienceId)

    // Validate that the audience exists
    if (!audience) {
      logger.info(`Audience with ID ${contactImport?.audienceId} does not exist.`)
      return this.done()
    }

    // Retrieve the team for the audience
    const team = await container.make(TeamRepository).findById(audience?.teamId)

    logger.info(`Processing import for team ${team?.id}.`)

    // Retrieve the CSV file from cloud storage
    const csvStream = await makeS3Client().getObjectStream(
      ContactImportRepository.getUploadedFileKey(contactImport.id, 'csv', team.id),
    )

    // Parse the CSV data into rows
    const parser = csvStream.pipe(CsvParser())

    // Process the CSV data using streams for efficiency
    const rows: Record<string, string>[] = await new Promise((resolve, reject) => {
      const rows: Record<string, string>[] = []

      parser
        .on('data', async (row) => {
          rows.push(row)
        })
        .on('end', () => resolve(rows))
        .on('error', (error) => reject(error))
    })

    logger.info(`Importing ${rows.length} contacts from csv.`)

    const contactRepository = container.make(ContactRepository)

    const chunkSize = 1000

    // Process the import within a transaction to ensure data consistency
    await database.transaction(async (tx) => {
      // Create tags specified in the import configuration
      const tagsToCreate = contactImport.propertiesMap.tags.map((tag) => ({
        id: cuid(),
        name: tag,
        audienceId: contactImport.audienceId,
      }))

      // Bulk create the tags
      const createdTags = await container
        .make(TagRepository)
        .transaction(tx)
        .bulkCreate(tagsToCreate)

      // Combine newly created tags with existing tags specified in the import
      const tagIdsToAttachToContacts = [
        ...createdTags.map((tag) => tag.id),
        ...contactImport.propertiesMap.tagIds,
      ]

      // Calculate the number of batches for processing
      const totalBatches = Math.ceil(rows.length / chunkSize)

      // Process contacts in batches to handle large imports efficiently
      for (let i = 0; i < rows.length; i += chunkSize) {
        const batch = rows.slice(i, i + chunkSize)

        logger.info(`Processing ${chunkSize} contacts in batch ${i} of ${batch.length}.`)

        // Collect custom properties for all contacts in the batch
        const allContactProperties: ContactProperty[] = []

        // Map CSV rows to contact objects
        const values = batch.map((row) => {
          const contactId = cuid()

          // Process custom properties defined in the import configuration
          const customProperties = contactImport.propertiesMap.customProperties ?? {}

          // For each custom property, extract the value and convert to the appropriate type
          for (const csvColumnHeaderName of Object.keys(customProperties)) {
            const property = customProperties[csvColumnHeaderName]
            const value = row[csvColumnHeaderName]

            // Only process properties with values
            if (property && value) {
              // Parse date values if the property type is date
              const date = property.type === 'date' ? DateTime.fromISO(value) : null

              // Create a contact property object with the appropriate type-specific field set
              allContactProperties.push({
                id: cuid(),
                contactId,
                name: property.id,
                audienceId: contactImport.audienceId,
                boolean: null,
                float: property.type === 'float' ? Number.parseFloat(value) : null,
                date: date?.isValid ? date.toJSDate() : null,
                text: property.type === 'text' ? value : null,
              })
            }
          }

          return {
            id: contactId,
            email: row[contactImport.propertiesMap.email],
            firstName: contactImport.propertiesMap.firstName
              ? row[contactImport.propertiesMap.firstName]
              : undefined,
            lastName: contactImport.propertiesMap.lastName
              ? row[contactImport.propertiesMap.lastName]
              : undefined,
            subscribedAt: contactImport.subscribeAllContacts
              ? DateTime.now().toJSDate()
              : undefined,
            audienceId: contactImport.audienceId,
            contactImportId: payload.contactImportId,
          }
        })

        logger.info(`Created ${values.length} contact values.`)

        // Bulk create or update contacts based on the import configuration
        const createdContacts = await contactRepository
          .transaction(tx)
          .bulkCreate(values, {
            // If updateExistingContacts is enabled, update existing contacts with new data
            // Otherwise, only insert new contacts
            set: contactImport.updateExistingContacts
              ? {
                  firstName: sql`values(${contacts.firstName})`,
                  lastName: sql`values(${contacts.lastName})`,
                  email: sql`${contacts.email}`, // no change to email (used as unique identifier)
                }
              : {},
          })

        logger.info(`Inserted ${createdContacts.length} contacts into database.`)

        // Process custom properties in batches
        for (let z = 0; z < allContactProperties.length; z += chunkSize) {
          const contactPropertiesBatch = allContactProperties.slice(z, z + chunkSize)

          if (contactPropertiesBatch.length > 0) {
            // Insert or update custom properties
            // Uses onDuplicateKeyUpdate to handle existing properties
            await tx
              .insert(contactProperties)
              .values(contactPropertiesBatch)
              .onDuplicateKeyUpdate({
                set: {
                  // Update all property type fields with their new values
                  float: sql`values(${contactProperties.float})`,
                  date: sql`values(${contactProperties.date})`,
                  text: sql`values(${contactProperties.text})`,
                  boolean: sql`values(${contactProperties.boolean})`,
                },
              })
          }
        }

        // Get the IDs of all created/updated contacts
        const contactIds = createdContacts.map((value) => value.id)

        // Create tag-contact associations for all contacts and tags
        const attachTagsToContacts = tagIdsToAttachToContacts.flatMap((tagId) =>
          contactIds.map((contactId) => ({
            contactId,
            tagId,
            assignedAt: new Date(),
          })),
        )

        // Process tag associations in batches
        if (attachTagsToContacts.length > 0) {
          for (let t = 0; t < attachTagsToContacts.length; t += chunkSize) {
            const tagsBatch = attachTagsToContacts.slice(t, t + chunkSize)

            // Insert tag-contact associations
            await tx.insert(tagsOnContacts).values(tagsBatch)
          }
        }
      }

      await container
        .make(ContactImportRepository)
        .transaction(tx)
        .update(contactImport.id, {
          status: 'SUCCESS',
        })
    })

    return this.done()
  }

  /**
   * Handles job failure by updating the import status.
   *
   * This method is called automatically when the job fails for any reason.
   * It updates the import record to reflect the failure, allowing the UI to
   * show the appropriate status and enabling retry mechanisms.
   *
   * @param context - The job context containing the payload
   */
  async failed({ payload }: JobContext<ImportContactsJobPayload>) {
    await container
      .make(ContactImportRepository)
      .update(payload.contactImportId, { status: 'FAILED' })
  }
}
