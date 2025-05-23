import { type SQLWrapper, and, eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/mysql-core'

import type { CreateBroadcastDto } from '#root/core/broadcasts/dto/create_broadcast_dto.js'

import type { DrizzleClient } from '#root/database/client.js'
import type {
  Broadcast,
  EmailContent,
  UpdateSetBroadcastInput,
} from '#root/database/database_schema_types.js'
import {
  abTestVariants,
  audiences,
  broadcasts,
  contacts,
  emailContents,
  segments,
} from '#root/database/schema.js'

import { AudienceRepository } from '#root/core/audiences/repositories/audience_repository.js'
import { SegmentRepository } from '#root/core/audiences/repositories/segment_repository.js'
import { SegmentBuilder } from '#root/core/audiences/utils/segment_builder/segment_builder.js'
import { hasOne } from '#root/database/utils/relationships.js'
import { makeDatabase } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'
import { container } from '#root/core/utils/typi.js'
import { DateTime } from 'luxon'

/**
 * BroadcastRepository handles database operations for email marketing campaigns.
 *
 * This repository is responsible for managing the persistence of broadcast campaigns,
 * including creating, retrieving, updating, and deleting broadcasts and their related
 * content. It implements the core data access patterns for the email marketing system,
 * which enables features like:
 *
 * - Creating broadcast campaigns with proper structure
 * - Loading broadcasts with their content, segments, and A/B test variants
 * - Updating broadcast configurations and content
 * - Calculating recipient counts for credit management
 *
 * The repository handles the complex relationships between broadcasts and related
 * entities like email content, segments, audiences, and A/B test variants.
 */
export class BroadcastRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  /**
   * Relationship between broadcasts and their email content.
   *
   * This relationship enables efficient loading of a broadcast with its email content
   * in a single query. The email content contains the actual message that will be sent,
   * including subject, body, sender information, and other content-related fields.
   *
   * The relationship is defined as a one-to-one relationship where the broadcast's
   * emailContentId references the ID of the email content record. This separation
   * allows for more efficient storage and retrieval of email content, especially
   * for A/B testing where multiple content variations may exist.
   */
  protected hasOneEmailContent() {
    return hasOne(this.database, {
      from: broadcasts,
      to: emailContents,
      primaryKey: broadcasts.id,
      foreignKey: emailContents.id,
      relationName: 'emailContent',
    })
  }

  broadcasts() {
    return this.crud(broadcasts)
  }

  /**
   * Creates a new broadcast campaign with empty email content.
   *
   * This method implements the broadcast creation process, which includes:
   * 1. Creating an empty email content record to store the message
   * 2. Creating the broadcast record with basic metadata
   * 3. Linking the broadcast to its audience, team, and sending domain
   *
   * The method creates the broadcast with a default DRAFT status, allowing
   * users to configure and edit the broadcast before sending it. The empty
   * email content record serves as a placeholder that will be populated
   * with the actual message content during the editing process.
   *
   * @param data - The broadcast metadata from the creation request
   * @param teamId - The ID of the team this broadcast belongs to
   * @returns Object containing the ID of the created broadcast
   */
  async create(
    data: CreateBroadcastDto & { sendingDomainId?: string; audienceId: string },
    teamId: string,
  ) {
    // Generate unique IDs for the broadcast and its email content
    const id = this.cuid()
    const emailContentId = this.cuid()

    // Create an empty email content record
    // This will be populated with the actual message content later
    await this.database.insert(emailContents).values({
      id: emailContentId,
    })

    // Create the broadcast record with basic metadata
    // Ensure senderIdentityId is properly typed
    const { senderIdentityId, ...restData } = data

    await this.database.insert(broadcasts).values({
      ...restData,
      senderIdentityId: senderIdentityId as string | undefined,
      teamId,
      id,
      emailContentId,
      createdAt: DateTime.now().toJSDate(),
    })

    return { id }
  }

  async update(id: string, { sendAt, ...payload }: Partial<UpdateSetBroadcastInput>) {
    await this.database
      .update(broadcasts)
      .set({
        ...payload,
        ...(sendAt ? { sendAt: new Date(sendAt as string) } : {}),
        updatedAt: DateTime.now().toJSDate(),
      })
      .where(eq(broadcasts.id, id))
    return { id }
  }

  async delete(id: string) {
    await this.database.delete(broadcasts).where(eq(broadcasts.id, id))

    return { id }
  }

  /**
   * Retrieves a broadcast with all its related data, including A/B test variants.
   *
   * This method implements a complex query that loads a complete broadcast with all
   * its related entities in a single database operation. It retrieves:
   *
   * 1. The broadcast record with basic metadata
   * 2. The segment used for targeting (if any)
   * 3. The audience the broadcast is being sent to
   * 4. The main email content for the broadcast
   * 5. All A/B test variants with their email content
   *
   * The method uses table aliases to handle the complex relationship between broadcasts
   * and email content, where both the main broadcast and each A/B test variant have
   * their own email content records.
   *
   * The results are transformed from a flat result set into a nested object structure
   * that matches the logical relationships between the entities, making it easier to
   * work with in the application code.
   *
   * @param id - The unique identifier of the broadcast to retrieve
   * @returns The broadcast with all its related data, or null if not found
   */
  async findByIdWithAbTestVariants(id: string) {
    // Create an alias for the broadcast's email content to distinguish it from variant content
    const broadcastEmailContents = alias(emailContents, 'broadcastEmailContents')

    // Execute a complex query that joins multiple tables to retrieve all related data
    const results = await this.database
      .select({
        broadcast: broadcasts,
        abTestVariant: abTestVariants,
        emailContent: emailContents,
        segment: segments,
        audience: audiences,
        broadcastEmailContent: broadcastEmailContents,
      })
      .from(broadcasts)
      .leftJoin(segments, eq(broadcasts.segmentId, segments.id))
      .leftJoin(audiences, eq(broadcasts.audienceId, audiences.id))
      .leftJoin(
        broadcastEmailContents,
        eq(broadcastEmailContents.id, broadcasts.emailContentId),
      )
      .leftJoin(abTestVariants, eq(abTestVariants.broadcastId, broadcasts.id))
      .leftJoin(emailContents, eq(emailContents.id, abTestVariants.emailContentId))
      .where(eq(broadcasts.id, id))

    // If no results are found, return null
    if (results.length === 0) {
      return null
    }

    // Extract the broadcast and its directly related entities from the first result
    const broadcast = results[0].broadcast
    const segment = results[0]?.segment
    const audience = results[0]?.audience
    const broadcastEmailContent = results[0]?.broadcastEmailContent

    // Process the A/B test variants, associating each with its email content
    // Filter out null variants that may result from the left join
    const variants = results
      .map((result) => ({
        ...result.abTestVariant,
        emailContent: result.emailContent as EmailContent,
      }))
      .filter((variant) => variant.id !== null)

    // Construct the final nested object structure
    return {
      ...broadcast,
      segment,
      audience,
      abTestVariants: variants,
      emailContent: broadcastEmailContent,
    }
  }

  async findById(id: string) {
    return this.findByIdWithAbTestVariants(id)
  }

  async findAllForTeam(teamId: string) {
    return this.database.query.broadcasts.findMany({
      with: {
        emailContent: true,
      },
      where: eq(broadcasts.teamId, teamId),
    })
  }

  /**
   * Calculates the total number of recipients for a broadcast.
   *
   * This method determines how many contacts will receive a broadcast by applying
   * the same audience and segment filtering logic used in the actual sending process.
   * It's used for several critical purposes:
   *
   * 1. Credit calculation - Ensuring the team has sufficient credits to send the broadcast
   * 2. Analytics - Providing accurate recipient counts for reporting
   * 3. A/B test configuration - Calculating sample sizes for test variants
   *
   * The method replicates the segment filtering logic from the ContactsConcern,
   * ensuring consistent recipient selection between the estimation and actual sending.
   *
   * @param broadcast - The broadcast to calculate recipients for
   * @returns Array of contact IDs that would receive the broadcast
   */
  async getTotalRecipients(broadcast: Broadcast) {
    const segmentQueryConditions: SQLWrapper[] = []

    // If the broadcast uses a segment, build the SQL conditions for it
    if (broadcast.segmentId) {
      const segment = await container
        .make(SegmentRepository)
        .findById(broadcast.segmentId)
      const audience = await container
        .make(AudienceRepository)
        .findById(broadcast.audienceId)

      // Build segment conditions using the SegmentBuilder
      // This ensures consistent filtering between estimation and actual sending
      if (segment && audience) {
        segmentQueryConditions.push(
          new SegmentBuilder(segment.filterGroups, audience).build(),
        )
      }
    }

    // Query the database to find all contacts that match the audience and segment criteria
    const recipients = await this.database
      .select({ id: contacts.id })
      .from(contacts)
      .where(
        and(eq(contacts.audienceId, broadcast.audienceId), ...segmentQueryConditions),
      )

    return recipients
  }
}
