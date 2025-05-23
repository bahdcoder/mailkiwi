import { randomBytes } from 'node:crypto'
import { Secret } from '@poppinss/utils'
import { eq } from 'drizzle-orm'

import type { DrizzleClient } from '#root/database/client.js'
import { accessTokens } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { ScryptTokenRepository } from '#root/core/shared/repositories/scrypt_token_repository.js'

/**
 * AccessTokenRepository manages API keys for authentication and authorization.
 *
 * This repository is a critical component of Kibamail's API authentication system, responsible for:
 * 1. Creating secure API keys with access key and secret pairs
 * 2. Validating API keys during authentication
 * 3. Storing and retrieving access token information
 * 4. Managing token capabilities for authorization
 *
 * The repository implements a secure token design pattern where each API key consists of:
 * - A public access key (used for identification)
 * - A secret key (used for authentication)
 * - A prefix to identify Kibamail tokens
 *
 * This approach provides strong security while enabling efficient token validation,
 * as the public access key can be used to quickly look up the token record without
 * performing expensive cryptographic operations on every token in the database.
 */
export class AccessTokenRepository extends ScryptTokenRepository {
  // Do not change any of the below protected values, as it will break all existing and generated access tokens
  protected opaqueAccessTokenPrefix = 'kbt_'
  protected keyPairDelimiter = ':'
  protected bytesSize = 16

  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  /**
   * Generates a secure random string for token creation.
   *
   * This method creates cryptographically secure random bytes for use in
   * access keys and secrets. The use of the Node.js crypto module ensures
   * that the generated values have sufficient entropy to resist brute force
   * and prediction attacks.
   *
   * @returns A hexadecimal string of random bytes
   */
  private getRandomBytes() {
    return randomBytes(this.bytesSize).toString('hex')
  }

  /**
   * Creates a new API key for a user or team.
   *
   * This method implements the secure API key creation process:
   * 1. Generates random values for the access key and secret
   * 2. Hashes the secret for secure storage
   * 3. Creates a human-readable name from the access key
   * 4. Combines and encodes the key pair for client use
   * 5. Stores the token information in the database
   *
   * The resulting API key follows the format: kbt_base64(accessKey:accessSecret)
   * This format allows the system to extract the access key for lookup without
   * needing to decrypt or hash the entire token, while still keeping the secret
   * secure for verification.
   *
   * @param ownerId - The ID of the user or team that owns the token
   * @param type - Whether the token belongs to a user or team
   * @param capabilities - The permissions granted to this token
   * @returns Object containing the API key, name, and ID
   */
  async create(ownerId: string, type: 'user' | 'team', capabilities: string[]) {
    // Generate random values for the access key and secret
    const accessKey = this.getRandomBytes()
    const accessSecret = this.getRandomBytes()

    // Hash the secret for secure storage
    // The original secret is never stored in the database
    const hashedAccessSecret = await this.hash(accessSecret)

    // Create a human-readable name from the first 8 characters of the access key
    // This helps users identify their tokens in the UI
    const name = accessKey.slice(0, 8)

    // Combine the access key and secret into a single token
    // This is the value that will be provided to the client
    const keyPairBase64 = Buffer.from(
      `${accessKey}${this.keyPairDelimiter}${accessSecret}`,
    ).toString('base64')

    // Add the prefix to identify this as a Kibamail token
    const apiKey = `${this.opaqueAccessTokenPrefix}${keyPairBase64}`

    // Generate a unique ID for the token record
    const id = this.cuid()

    // Store the token information in the database
    // Note that we store the hashed secret, not the original secret
    await this.database.insert(accessTokens).values({
      ...(type === 'user' ? { userId: ownerId } : { teamId: ownerId }),
      name,
      accessKey,
      capabilities,
      accessSecret: hashedAccessSecret,
    })

    // Return the API key and metadata to the caller
    return {
      apiKey,
      name,
      id,
    }
  }

  /**
   * Validates an API key and retrieves the associated token information.
   *
   * This method implements the secure API key validation process:
   * 1. Extracts the base64-encoded token from the API key
   * 2. Decodes the token to get the access key and secret
   * 3. Looks up the token record using the access key
   * 4. Verifies the secret against the stored hash
   * 5. Returns the token information if valid
   *
   * The validation process is designed to be both secure and efficient:
   * - The database lookup is performed using only the access key, which is indexed
   * - The expensive cryptographic verification is only performed once per request
   * - The original secret is never stored or logged
   *
   * @param apiKey - The API key to validate
   * @returns The token information if valid, or null if invalid
   */
  async check(apiKey: string) {
    // Extract the base64-encoded token from the API key
    const [, base64Token] = apiKey.split(`${this.opaqueAccessTokenPrefix}`)

    // Decode the token to get the access key and secret
    const decodedToken = Buffer.from(base64Token, 'base64').toString()

    // Split the decoded token into access key and secret
    const [accessKey, accessSecret] = decodedToken.split(this.keyPairDelimiter)

    // Look up the token record using the access key
    const token = await this.getAccessTokenFromAccessKey(accessKey)

    // If no token record is found, the API key is invalid
    if (!token) return null

    // Verify the secret against the stored hash
    const isValid = await this.verify(accessSecret, token.accessSecret)

    // If the secret doesn't match, the API key is invalid
    if (!isValid) {
      return null
    }

    // Return the token information for use in authorization
    return token
  }

  /**
   * Retrieves a token record by its access key with caching.
   *
   * This method implements an efficient token lookup process with caching:
   * 1. Clears any existing cache entry for the access key
   * 2. Attempts to retrieve the token from the cache
   * 3. If not in cache, queries the database and caches the result
   *
   * The caching approach optimizes performance for frequently used API keys
   * while ensuring that token revocations take effect immediately by clearing
   * the cache before each lookup.
   *
   * @param accessKey - The access key to look up
   * @returns The token record if found, or null if not found
   */
  async getAccessTokenFromAccessKey(accessKey: string) {
    // Clear any existing cache entry to ensure we get fresh data
    // This is important for security, as it ensures token revocations take effect immediately
    await this.cache.namespace('access_tokens').clear(accessKey)

    // Attempt to retrieve the token from cache, or query the database if not cached
    return this.cache.namespace('access_tokens').get(accessKey, async () => {
      // Query the database for the token record
      const [token] = await this.database
        .select()
        .from(accessTokens)
        .where(eq(accessTokens.accessKey, accessKey))
        .limit(1)

      return token
    })
  }
}
