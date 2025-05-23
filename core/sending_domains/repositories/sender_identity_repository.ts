import { and, eq } from 'drizzle-orm'

import type {
  InsertSenderIdentity,
  SenderIdentity,
  SenderIdentityWithSendingDomain,
  UpdateSenderIdentity,
} from '#root/database/database_schema_types.js'
import { senderIdentities, sendingDomains } from '#root/database/schema.js'
import { belongsTo } from '#root/database/utils/relationships.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'
import { ScryptTokenRepository } from '#root/core/shared/repositories/scrypt_token_repository.js'

/**
 * SenderIdentityRepository manages database operations for sender identities.
 *
 * This repository handles the persistence of sender identity profiles that users
 * can select when sending broadcasts. It provides methods for:
 *
 * - Creating, updating, and deleting sender identities
 * - Finding sender identities by team or sending domain
 * - Managing email verification for sender identities
 *
 * Sender identities improve the user experience by providing consistent sender
 * information across campaigns and reducing the potential for errors when
 * configuring email sending details.
 */
export class SenderIdentityRepository extends ScryptTokenRepository {
  constructor(protected database = makeDatabase()) {
    super()
  }

  senderIdentities() {
    return this.crud(senderIdentities)
  }

  /**
   * Relationship between sender identities and their sending domains.
   *
   * This relationship enables efficient loading of a sender identity with its
   * associated sending domain in a single query. The sending domain provides
   * the domain part of the email address and authentication settings.
   */
  protected belongsToSendingDomain() {
    return belongsTo(this.database, {
      from: senderIdentities,
      to: sendingDomains,
      primaryKey: sendingDomains.id,
      foreignKey: senderIdentities.sendingDomainId,
      relationName: 'sendingDomain',
    })
  }

  /**
   * Relationship between sender identities and their teams.
   *
   * This relationship enables efficient loading of a sender identity with its
   * associated team in a single query. The team represents the organization
   * that owns the sender identity.
   */
  protected belongsToTeam() {
    return belongsTo(this.database, {
      from: senderIdentities,
      to: senderIdentities,
      primaryKey: senderIdentities.id,
      foreignKey: senderIdentities.teamId,
      relationName: 'team',
    })
  }

  /**
   * Creates a new sender identity.
   *
   * @param payload - The sender identity data to create
   * @returns The ID of the created sender identity
   */
  async create(payload: InsertSenderIdentity) {
    const id = this.cuid()

    const {
      emailVerificationCode,
      emailVerificationCodeExpiresAt,
      plainEmailVerificationCode,
    } = await this.createEmailVerificationCode()

    await this.database.insert(senderIdentities).values({
      id,
      ...payload,
      emailVerificationCode,
      emailVerificationCodeExpiresAt,
    })

    return { id, plainEmailVerificationCode }
  }

  /**
   * Updates an existing sender identity.
   *
   * @param senderIdentityId - The ID of the sender identity to update
   * @param payload - The sender identity data to update
   */
  async update(senderIdentityId: string, payload: UpdateSenderIdentity) {
    await this.database
      .update(senderIdentities)
      .set(payload)
      .where(eq(senderIdentities.id, senderIdentityId))
  }

  /**
   * Deletes a sender identity.
   *
   * @param senderIdentityId - The ID of the sender identity to delete
   * @returns The ID of the deleted sender identity
   */
  async delete(senderIdentityId: string) {
    await this.database
      .delete(senderIdentities)
      .where(eq(senderIdentities.id, senderIdentityId))

    return { id: senderIdentityId }
  }

  /**
   * Finds a sender identity by ID.
   *
   * @param senderIdentityId - The ID of the sender identity to find
   * @returns The sender identity or undefined if not found
   */
  async findById(
    senderIdentityId: string,
  ): Promise<SenderIdentityWithSendingDomain | undefined> {
    const [senderIdentity] = await this.belongsToSendingDomain()((query) =>
      query.where(eq(senderIdentities.id, senderIdentityId)),
    )

    return senderIdentity as SenderIdentityWithSendingDomain
  }

  /**
   * Finds all sender identities for a team.
   *
   * @param teamId - The ID of the team
   * @returns An array of sender identities
   */
  async findAllForTeam(teamId: string): Promise<SenderIdentity[]> {
    return this.database
      .select()
      .from(senderIdentities)
      .where(eq(senderIdentities.teamId, teamId))
  }

  /**
   * Finds all sender identities for a sending domain.
   *
   * @param sendingDomainId - The ID of the sending domain
   * @returns An array of sender identities
   */
  async findAllForSendingDomain(sendingDomainId: string): Promise<SenderIdentity[]> {
    return this.database
      .select()
      .from(senderIdentities)
      .where(eq(senderIdentities.sendingDomainId, sendingDomainId))
  }

  /**
   * Finds a sender identity by team and name.
   *
   * @param teamId - The ID of the team
   * @param name - The name of the sender identity
   * @returns The sender identity or undefined if not found
   */
  async findByTeamAndName(
    teamId: string,
    name: string,
  ): Promise<SenderIdentity | undefined> {
    const [senderIdentity] = await this.database
      .select()
      .from(senderIdentities)
      .where(and(eq(senderIdentities.teamId, teamId), eq(senderIdentities.name, name)))
      .limit(1)

    return senderIdentity
  }
}
