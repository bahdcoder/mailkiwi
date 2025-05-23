import { count, eq } from 'drizzle-orm'

import type { CreateTeamDto } from '#root/core/teams/dto/create_team_dto.js'

import {
  broadcastGroups,
  creditGrantMandates,
  creditPurchases,
  sendingDomains,
  teamMemberships,
  teams,
  users,
} from '#root/database/schema.js'
import { hasMany } from '#root/database/utils/relationships.js'

import { FREE_MONTHLY_CREDITS } from '#root/core/app/env/app_env.js'
import { makeDatabase, makeRedis } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'
import { DateTime } from 'luxon'
import type { DrizzleClient } from '#root/database/client.js'

/**
 * TeamRepository handles database operations for team management.
 *
 * This repository is a critical component of Kibamail's multi-tenant architecture,
 * responsible for managing the persistence of teams and their relationships. It implements
 * the core data access patterns for the team system, which enables features like:
 *
 * - Creating and managing teams
 * - Handling team memberships and permissions
 * - Managing team resources like sending domains
 * - Implementing the free credit system for new teams
 *
 * The repository uses transactions for operations that modify multiple related records,
 * ensuring data consistency even in case of failures. It also implements caching for
 * frequently accessed team data to improve performance.
 */
export class TeamRepository extends BaseRepository {
  constructor(
    protected database = makeDatabase(),
    protected redis = makeRedis(),
  ) {
    super()
  }

  /**
   * Relationship between teams and their members.
   *
   * This relationship enables efficient loading of a team with all its members
   * in a single query. The members represent users who have access to the team,
   * with different roles determining their permissions.
   *
   * This relationship is critical for the authorization system, as it's used
   * to determine what actions a user can perform within a team based on their
   * membership role.
   */
  private hasManyMemberships() {
    return hasMany(this.database, {
      from: teams,
      to: teamMemberships,
      primaryKey: teams.id,
      foreignKey: teamMemberships.teamId,
      relationName: 'members',
    })
  }

  /**
   * Relationship between teams and their sending domains.
   *
   * This relationship enables efficient loading of a team with all its sending domains
   * in a single query. Sending domains are critical for email deliverability, as they
   * determine the domains used for sending emails and tracking links.
   *
   * Each team can have multiple sending domains, allowing for different branding
   * and deliverability configurations for different types of emails.
   */
  private hasManySendingDomains() {
    return hasMany(this.database, {
      from: teams,
      to: sendingDomains,
      primaryKey: teams.id,
      foreignKey: sendingDomains.teamId,
      relationName: 'sendingDomains',
    })
  }

  /**
   * Creates the first team for a user if one doesn't already exist.
   *
   * This method is used during the onboarding process to ensure that every
   * user has at least one team. It checks if the user already has a team,
   * and if not, creates one with the provided details.
   *
   * This approach simplifies the onboarding flow by automatically creating
   * a team for new users, while preventing duplicate teams for existing users.
   *
   * @param payload - The team creation data
   * @param userId - The ID of the user creating the team
   * @returns The existing or newly created team
   */
  async createFirstTeam(payload: CreateTeamDto, userId: string) {
    // Check if the user already has a team
    const [teamExists] = await this.teams().findAll(eq(teams.userId, userId))

    // If a team exists, return it instead of creating a new one
    if (teamExists) return teamExists

    // Create the first team for the user
    return this.create(payload, userId)
  }

  /**
   * Creates a new team with free starter credits.
   *
   * This method implements the team creation process, which includes:
   * 1. Creating the team record with basic metadata
   * 2. Setting up a credit grant mandate for recurring free credits
   * 3. Adding an initial credit purchase for immediate use
   *
   * The method uses a database transaction to ensure that all records are created
   * atomically - either all succeed or all fail. This prevents partial team creation
   * that could leave the system in an inconsistent state.
   *
   * New teams receive free monthly credits to help users get started with the platform
   * without requiring immediate payment. This approach encourages adoption while
   * still providing a path to monetization for users who need more credits.
   *
   * @param payload - The team metadata from the creation request
   * @param userId - The ID of the user creating the team (becomes the owner)
   * @returns Object containing the ID of the created team
   */
  async create(payload: CreateTeamDto, userId: string) {
    // Generate a unique ID for the team
    const id = this.cuid()

    const insertTeamRecord = async (trx: DrizzleClient) => {
      // Create the team record with basic metadata
      await trx.insert(teams).values({
        id,
        userId, // Set the creating user as the team owner
        ...payload,
      })

      // Set up a credit grant mandate for recurring free credits
      // This will automatically grant free credits each month
      await trx.insert(creditGrantMandates).values({
        id: this.cuid(),
        teamId: id,
        status: 'active',
        amount: FREE_MONTHLY_CREDITS,
        createdAt: DateTime.now().toJSDate(),
      })

      // Add an initial credit purchase for immediate use
      // This is a zero-cost purchase that provides the free starter credits
      await trx.insert(creditPurchases).values({
        id: this.cuid(),
        teamId: id,
        status: 'successful',
        amountPaid: 0,
        amount: FREE_MONTHLY_CREDITS,
        currency: 'NGN',
        paymentProvider: 'paystack',
        createdAt: DateTime.now().toJSDate(),
        // Set expiration to the start of the next month
        expiresAt: DateTime.now().endOf('month').plus({ millisecond: 1 }).toJSDate(),
      })
    }

    if (this.isATransactionRepository) {
      await insertTeamRecord(this.database)

      return { id }
    }

    await this.database.transaction(async (trx) => {
      await insertTeamRecord(trx)
    })

    return { id }
  }

  /**
   * Finds the first team owned by a user.
   *
   * This method retrieves the first team where the user is the owner (creator).
   * It's used in scenarios where we need to find a team for a user but don't
   * have a specific team ID, such as during initial login or when setting
   * default context.
   *
   * The query is optimized to only retrieve the team ID and limits to a single
   * result, as we only need to find one team for the user.
   *
   * @param userId - The ID of the user to find a team for
   * @returns The first team owned by the user, or undefined if none exists
   */
  async findUserFirstTeam(userId: string) {
    const [team] = await this.database
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.userId, userId))
      .limit(1)

    return team
  }

  /**
   * Finds the default team for a user with membership information.
   *
   * This method retrieves the first team owned by the user, including all
   * team memberships. It's used to establish the initial team context when
   * a user logs in or when no specific team is selected.
   *
   * Unlike findUserFirstTeam, this method loads the complete team with its
   * memberships, providing all the information needed for authorization checks.
   *
   * @param userId - The ID of the user to find a team for
   * @returns The default team with memberships, or undefined if none exists
   */
  async findUserDefaultTeam(userId: string) {
    const team = await this.hasManyMemberships()((query) =>
      query
        .leftJoin(users, eq(users.id, teamMemberships.userId))
        .where(eq(teams.userId, userId))
        .limit(1),
    )

    return team[0]
  }

  /**
   * Finds a team by ID with all its memberships and user details.
   *
   * This method retrieves a complete team record with all its memberships,
   * including user details for each member. It's the primary method used
   * to load team data for authorization checks and team management.
   *
   * The method uses the hasManyMemberships relationship to efficiently load
   * all related data in a single query, and includes a row transformer to
   * structure the user data within each membership record.
   *
   * @param teamId - The ID of the team to retrieve
   * @returns The team with all memberships and user details, or undefined if not found
   */
  async findById(teamId: string) {
    const [team] = await this.hasManyMemberships()(
      (query) =>
        query
          .leftJoin(users, eq(users.id, teamMemberships.userId))
          .where(eq(teams.id, teamId)),
      (row) => ({
        ...row.teamMemberships,
        user: row?.users, // Include user details in each membership
      }),
    )

    return team
  }

  public teams() {
    return this.crud(teams)
  }

  completedOnboarding(teamId: string) {
    const self = this

    return {
      async engage() {
        const [broadcastGroupsCount] = await self.database
          .select({ count: count() })
          .from(broadcastGroups)
          .where(eq(broadcastGroups.teamId, teamId))

        return broadcastGroupsCount.count > 0
      },
      async send() {
        // TODO: Check if user has added sending domain.
        return false
      },
    }
  }

  /**
   * Finds a team by ID with all its sending domains, with caching.
   *
   * This method retrieves a team with all its sending domains, using Redis
   * caching to improve performance for frequently accessed teams. It's used
   * when rendering email sending forms and configuring email settings.
   *
   * The caching approach optimizes performance by avoiding repeated database
   * queries for the same team, which is particularly important for sending
   * domains as they're frequently accessed during email sending operations.
   *
   * @param teamId - The ID of the team to retrieve
   * @returns The team with all sending domains, or undefined if not found
   */
  async findByIdWithDomains(teamId: string) {
    return this.cache
      .namespace('teams')
      .get(`team_with_sending_domains:${teamId}`, async () => {
        const [team] = await this.hasManySendingDomains()((query) =>
          query.where(eq(teams.id, teamId)),
        )

        return team
      })
  }
}
