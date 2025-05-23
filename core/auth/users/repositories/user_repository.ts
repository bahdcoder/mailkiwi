import { eq } from 'drizzle-orm'
import { DateTime } from 'luxon'

import { TeamMembershipRepository } from '#root/core/teams/repositories/team_membership_repository.js'

import {
  Oauth2Driver,
  type Oauth2Response,
  Oauth2UserResponse,
} from '#root/core/auth/oauth2_drivers/base_driver.js'

import type { DrizzleClient } from '#root/database/client.js'
import type {
  InsertUser,
  UpdateUser,
  UserWithTeams,
} from '#root/database/database_schema_types.js'
import {
  channelMemberships,
  oauth2Accounts,
  teamMemberships,
  teams,
  users,
} from '#root/database/schema.js'
import { hasMany } from '#root/database/utils/relationships.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { ScryptTokenRepository } from '#root/core/shared/repositories/scrypt_token_repository.js'
import { OtpGenerator } from '#root/core/shared/tokens/otp_generator.js'

import { container } from '#root/core/utils/typi.js'

/**
 * UserRepository manages user accounts and authentication operations.
 *
 * This repository is a core component of Kibamail's authentication system, responsible for:
 * 1. User account creation and management
 * 2. Password hashing and verification
 * 3. Email verification processes
 * 4. OAuth account linking
 * 5. Team membership management
 *
 * The repository implements various relationships between users and other entities
 * (teams, memberships, channels, OAuth accounts) to support the multi-tenant
 * architecture of Kibamail, where users can belong to multiple teams and have
 * different roles within each team.
 */
export class UserRepository extends ScryptTokenRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  users() {
    return this.crud(users)
  }

  /**
   * Relationship between users and the teams they own.
   * This relationship is used to retrieve all teams created by a user.
   */
  private hasManyTeams() {
    return hasMany(this.database, {
      from: users,
      to: teams,
      primaryKey: users.id,
      foreignKey: teams.userId,
      relationName: 'teams',
    })
  }

  /**
   * Relationship between users and their channel memberships.
   * This relationship is used for the chat/collaboration features,
   * allowing users to participate in different communication channels.
   */
  private hasManyChannelMemberships() {
    return hasMany(this.database, {
      from: users,
      to: channelMemberships,
      primaryKey: users.id,
      foreignKey: channelMemberships.userId,
      relationName: 'channels',
    })
  }

  /**
   * Relationship between users and their OAuth accounts.
   * This relationship supports social login features, allowing users
   * to authenticate via providers like Google and GitHub.
   */
  private hasManyOauth2Accounts() {
    return hasMany(this.database, {
      from: users,
      to: oauth2Accounts,
      primaryKey: users.id,
      foreignKey: oauth2Accounts.userId,
      relationName: 'accounts',
    })
  }

  /**
   * Creates a new user account from OAuth authentication data.
   *
   * This method implements the OAuth user creation process:
   * 1. Creates a new user record with data from the OAuth provider
   * 2. Creates an OAuth account record linking to the provider
   * 3. Marks the email as verified (trusted from the OAuth provider)
   * 4. Securely stores the encrypted OAuth access token
   *
   * The method uses a database transaction to ensure that both the user
   * and OAuth account records are created atomically, preventing orphaned
   * or incomplete records in case of failures.
   *
   * Users created via OAuth are considered to have verified emails since
   * the OAuth provider has already verified their email ownership.
   *
   * @param oauth2Response - The authentication data from the OAuth provider
   * @returns Object containing the new user ID and OAuth account ID
   */
  async createWithOauth2Account(oauth2Response: Oauth2Response) {
    // Generate unique IDs for the user and OAuth account
    const id = this.cuid()
    const accountId = this.cuid()

    // Use a transaction to ensure both records are created atomically
    await this.database.transaction(async (trx) => {
      // Create the user record with data from the OAuth provider
      await trx.insert(users).values({
        id,
        email: oauth2Response.user.email as string,
        firstName: oauth2Response.user.firstName,
        lastName: oauth2Response.user.lastName,
        // Mark the email as verified since it's trusted from the OAuth provider
        emailVerifiedAt: DateTime.now().toJSDate(),
        lastLoggedInAt: DateTime.now().toJSDate(),
        lastLoggedInProvider: oauth2Response.provider,
      })

      // Create the OAuth account record linking to the provider
      await trx.insert(oauth2Accounts).values({
        id: accountId,
        userId: id,
        provider: oauth2Response.provider,
        providerId: oauth2Response.user.providerId,
        // Securely store the encrypted OAuth access token
        accessToken: this.encrypt(oauth2Response.accessToken.token).release(),
      })
    })

    return { id, accountId }
  }

  /**
   * Creates a new user account with email verification.
   *
   * This method implements the standard user creation process:
   * 1. Generates a unique ID for the new user
   * 2. Creates a secure email verification code
   * 3. Stores the user record with the hashed verification code
   * 4. Returns the plain verification code to be sent to the user
   *
   * Unlike OAuth-based registration, users created through this method
   * must verify their email address before gaining full access to the system.
   * This verification step helps prevent spam accounts and ensures that
   * users have access to the email addresses they register with.
   *
   * @param user - The user data to create
   * @returns Object containing the new user ID and email verification code
   */
  async create(user: InsertUser) {
    const id = this.cuid()

    const {
      emailVerificationCode,
      emailVerificationCodeExpiresAt,
      plainEmailVerificationCode,
    } = await this.createEmailVerificationCode()

    await this.database
      .insert(users)
      .values({
        id,
        ...user,
        emailVerificationCode,
        emailVerificationCodeExpiresAt,
      })
      .execute()

    return { id, emailVerificationCode: plainEmailVerificationCode }
  }

  /**
   * Determines if a user has completed the onboarding process.
   *
   * This method checks if the user has provided all required profile information
   * and verified their email address. A complete user profile requires:
   * 1. A first name
   * 2. A last name
   * 3. A verified email address
   *
   * This check is used to determine if users should be directed to complete
   * their profile or can proceed directly to the main application. It ensures
   * that all users have the minimum required information before using the system.
   *
   * @param user - The user to check
   * @returns True if the user has completed onboarding, false otherwise
   */
  completedOnboarding(user: UserWithTeams) {
    return Boolean(user.firstName && user.lastName && user.emailVerifiedAt)
  }

  /**
   * Updates a user's profile information.
   *
   * This method implements the user update process:
   * 1. Hashes any new password provided for security
   * 2. Updates the user record with the new information
   *
   * The method handles password updates securely by hashing the password
   * before storing it in the database. This ensures that passwords are
   * never stored in plain text, protecting user accounts even if the
   * database is compromised.
   *
   * @param userId - The ID of the user to update
   * @param payload - The user data to update
   * @returns Object containing the user ID
   */
  async update(userId: string, payload: UpdateUser) {
    // If a password is provided, hash it before storing
    if (payload.password !== undefined) {
      payload.password = await this.hash(payload.password as string)
    }

    // Update the user record with the new information
    await this.database
      .update(users)
      .set({ ...payload })
      .where(eq(users.id, userId))

    return { id: userId }
  }

  /**
   * Finds a user by their email address.
   *
   * This method is primarily used for authentication, allowing users to
   * log in with their email address. It's also used for registration to
   * check if an email is already in use.
   *
   * The query is optimized with a limit of 1 since email addresses are
   * unique in the system, and we only need the first matching record.
   *
   * @param email - The email address to search for
   * @returns The user if found, or undefined if not found
   */
  async findByEmail(email: string) {
    const [user] = await this.hasManyTeams()((query) =>
      query.where(eq(users.email, email)),
    )

    return user
  }

  async findByOauth2AccountProviderId(id: string) {}

  async findByIdWithChannelMemberships(id: string) {
    const [user] = await this.hasManyChannelMemberships()((query) =>
      query.where(eq(users.id, id)),
    )

    return user
  }

  /**
   * Finds a user by their ID and includes their owned teams.
   *
   * This method retrieves a user along with all teams they have created.
   * It uses the hasManyTeams relationship to efficiently load this data
   * in a single query, avoiding the need for separate queries to fetch
   * the teams.
   *
   * This method is commonly used when loading a user's profile or when
   * establishing the team context during authentication.
   *
   * @param id - The user's unique identifier
   * @returns The user with their owned teams, or undefined if not found
   */
  async findById(id: string) {
    const userWithTeams = await this.hasManyTeams()((query) =>
      query.where(eq(users.id, id)),
    )

    return userWithTeams[0]
  }

  /**
   * Retrieves a user with their teams and team memberships.
   *
   * This method efficiently loads all the team-related data for a user in a single operation,
   * including:
   * 1. The user's basic profile information
   * 2. Teams created by the user
   * 3. All team memberships, including teams created by others
   *
   * This comprehensive data is essential for the multi-tenant features of Kibamail,
   * where users can belong to multiple teams and need to be able to switch between
   * them in the UI. It's also used during authentication to establish the correct
   * team context for the user's session.
   *
   * @param id - The user's unique identifier
   * @returns Object containing the user with their teams and all team memberships
   */
  async findWithTeamsAndMemberships(id: string) {
    // Load the user and their memberships in parallel for efficiency
    const [memberships, user] = await Promise.all([
      container.make(TeamMembershipRepository).findAllForUser(id),
      this.findById(id),
    ])

    return { user, memberships }
  }

  /**
   * Initiates an email change process for a user.
   *
   * This method starts the email change workflow by:
   * 1. Storing the new email in the unconfirmedEmail field
   * 2. Generating a verification code using existing infrastructure
   * 3. Setting up expiration for the verification process
   *
   * The current email remains unchanged and verified throughout this process,
   * ensuring users can abandon the change without losing their verified status.
   *
   * @param userId - The ID of the user requesting the email change
   * @param newEmail - The new email address to change to
   * @returns Object containing the verification code to send to the new email
   */
  async initiateEmailChange(userId: string, newEmail: string) {
    const {
      emailVerificationCode,
      emailVerificationCodeExpiresAt,
      plainEmailVerificationCode,
    } = await this.createEmailVerificationCode()

    await this.database
      .update(users)
      .set({
        unconfirmedEmail: newEmail,
        emailVerificationCode,
        emailVerificationCodeExpiresAt,
      })
      .where(eq(users.id, userId))

    return { emailVerificationCode: plainEmailVerificationCode }
  }

  /**
   * Confirms an email change with verification code.
   *
   * This method completes the email change process by:
   * 1. Verifying the provided code against the stored hash
   * 2. Atomically moving unconfirmedEmail to email
   * 3. Updating emailVerifiedAt to mark the new email as verified
   * 4. Clearing all verification fields
   *
   * The operation is atomic to prevent inconsistent states during the email swap.
   *
   * @param userId - The ID of the user confirming the email change
   * @param code - The verification code provided by the user
   * @returns True if verification succeeded and email was updated
   */
  async confirmEmailChange(userId: string, code: string) {
    const user = await this.findById(userId)

    if (!user?.unconfirmedEmail) {
      return false
    }

    const isValidCode = await this.confirmEmailVerificationCode(user, code)

    if (!isValidCode) {
      return false
    }

    await this.database
      .update(users)
      .set({
        email: user.unconfirmedEmail,
        unconfirmedEmail: null,
        emailVerifiedAt: DateTime.now().toJSDate(),
        emailVerificationCode: null,
        emailVerificationCodeExpiresAt: null,
      })
      .where(eq(users.id, userId))

    return true
  }

  /**
   * Cancels a pending email change request.
   *
   * This method allows users to abandon an email change process by:
   * 1. Clearing the unconfirmedEmail field
   * 2. Clearing verification code fields
   *
   * The current email and its verification status remain completely unchanged.
   *
   * @param userId - The ID of the user canceling the email change
   */
  async cancelEmailChange(userId: string) {
    await this.database
      .update(users)
      .set({
        unconfirmedEmail: null,
        emailVerificationCode: null,
        emailVerificationCodeExpiresAt: null,
      })
      .where(eq(users.id, userId))

    return { id: userId }
  }
}
