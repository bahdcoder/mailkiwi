import { eq } from 'drizzle-orm'

import { emailContents, emails } from '#root/database/schema.js'
import { belongsTo } from '#root/database/utils/relationships.js'

import { makeDatabase, makeRedis } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'

/**
 * EmailRepository provides data access methods for email records.
 *
 * This repository is responsible for retrieving and managing email data,
 * including the relationships between emails and their content. It implements
 * the repository pattern to abstract database access and provide a clean API
 * for working with email data.
 *
 * The repository handles the complex relationship between emails and email content,
 * which are stored in separate tables for better data organization and performance.
 */
export class EmailRepository extends BaseRepository {
  constructor(
    protected database = makeDatabase(),
    protected redis = makeRedis(),
  ) {
    super()
  }

  /**
   * Creates a relationship query builder for the email-to-content relationship.
   *
   * This private method configures the relationship between emails and their content,
   * using the belongsTo utility to create a query builder that automatically joins
   * the related tables. This approach simplifies queries that need to access both
   * email metadata and content in a single operation.
   *
   * @returns A configured query builder for the email-content relationship
   */
  private belongsToEmailContent() {
    return belongsTo(this.database, {
      from: emails,
      to: emailContents,
      primaryKey: emailContents.id,
      foreignKey: emails.emailContentId,
      relationName: 'emailContent',
    })
  }

  /**
   * Finds an email by its unique identifier, including its content.
   *
   * This method retrieves a complete email record with its associated content,
   * which is essential for operations that need to access both the email metadata
   * (like recipient, subject, etc.) and the actual content (HTML/text body).
   *
   * The method uses the relationship query builder to efficiently join the
   * emails and emailContents tables in a single query.
   *
   * @param emailId - The unique identifier of the email to retrieve
   * @returns The email record with its content, or undefined if not found
   */
  async findById(emailId: string) {
    const [email] = await this.belongsToEmailContent()((query) =>
      query.where(eq(emails.id, emailId)),
    )

    return email
  }
}
