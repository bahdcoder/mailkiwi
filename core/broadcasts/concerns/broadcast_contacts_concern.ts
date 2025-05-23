import { type SQL, type SQLWrapper, and, asc, eq, sql } from 'drizzle-orm'

import { SegmentBuilder } from '#root/core/audiences/utils/segment_builder/segment_builder.js'

import type { DrizzleClient } from '#root/database/client.js'
import type {
  Audience,
  BroadcastWithSegmentAndAbTestVariants,
} from '#root/database/database_schema_types.js'
import { contacts } from '#root/database/schema.js'

/**
 * ContactsConcern handles contact selection and filtering for broadcast campaigns.
 *
 * This class is responsible for the critical task of determining which contacts should
 * receive a broadcast email. It implements the core audience targeting logic by:
 *
 * 1. Applying segment filters to select specific subsets of an audience
 * 2. Handling pagination for processing large contact lists in batches
 * 3. Ensuring consistent ordering of contacts for reliable batch processing
 *
 * The concern is used by both regular broadcasts and A/B test broadcasts to retrieve
 * the appropriate contacts based on audience and segment criteria. This separation of
 * concerns allows the same filtering logic to be reused across different broadcast types.
 */
export class ContactsConcern {
  database: DrizzleClient

  broadcast: BroadcastWithSegmentAndAbTestVariants
  audience: Audience

  /**
   * Builds the SQL query conditions for filtering contacts based on audience and segment criteria.
   *
   * This method constructs the WHERE clause for selecting contacts that should receive
   * the broadcast. It combines two types of conditions:
   *
   * 1. Audience membership - Ensures contacts belong to the broadcast's audience
   * 2. Segment criteria - Applies additional filtering based on contact properties and behaviors
   *    if a segment is specified for the broadcast
   *
   * The segment filtering uses the SegmentBuilder to convert the declarative segment definition
   * into SQL conditions. This allows for sophisticated targeting based on contact properties,
   * tags, engagement history, and other attributes.
   *
   * @returns SQL condition for filtering contacts or undefined if no valid conditions
   */
  filterContactsQuery(): SQL | undefined {
    const segmentQueryConditions: SQLWrapper[] = []

    // If the broadcast has a segment, build the SQL conditions for it
    if (this.broadcast.segment) {
      segmentQueryConditions.push(
        new SegmentBuilder(this.broadcast.segment.filterGroups, this.audience).build(),
      )
    }

    // Combine audience membership with any segment conditions
    return and(
      eq(contacts.audienceId, this.broadcast.audience.id),
      ...segmentQueryConditions,
    )
  }

  /**
   * Retrieves a batch of contact IDs that should receive the broadcast.
   *
   * This method implements the paginated retrieval of contacts for batch processing.
   * It applies the filtering conditions from filterContactsQuery() and adds pagination
   * parameters to retrieve a specific subset of the matching contacts.
   *
   * The consistent ordering by contact ID ensures that:
   * 1. Batches don't overlap or miss contacts when processing large lists
   * 2. A/B test variants can be assigned to contacts in a deterministic way
   * 3. The same contacts are processed in the same order across multiple runs
   *
   * This batched approach is crucial for handling large audiences efficiently,
   * as it prevents memory issues and allows for better error handling and retry logic.
   *
   * @param offSet - Number of contacts to skip (for pagination)
   * @param limit - Maximum number of contacts to retrieve
   * @returns Array of contact IDs for the specified batch
   */
  async getContactIds(offSet: number, limit: number) {
    return this.database
      .select({ id: contacts.id })
      .from(contacts)
      .where(this.filterContactsQuery())
      .orderBy(asc(contacts.id)) // Consistent ordering is critical for reliable batch processing
      .limit(limit) // Limit the number of contacts per batch
      .offset(offSet) // Skip contacts that have been processed in previous batches
  }
}
