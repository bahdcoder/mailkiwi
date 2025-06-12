import { eq } from 'drizzle-orm'

import { CreateTeamAccessTokenAction } from '#root/core/auth/actions/create_team_access_token.js'
import { DeleteTeamAccessTokenAction } from '#root/core/auth/actions/delete_team_access_token.js'
import { CreateTeamAccessTokenSchema } from '#root/core/auth/dto/create_team_access_token_dto.js'
import { DeleteTeamAccessTokenSchema } from '#root/core/auth/dto/delete_team_access_token_dto.js'

import { AccessTokenRepository } from '#root/core/auth/acess_tokens/repositories/access_token_repository.js'

import { accessTokens } from '#root/database/schema.js'

import { E_UNAUTHORIZED, E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

import { makeApp } from '#root/core/shared/container/index.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'

/**
 * ApiKeysController handles API key management for teams.
 *
 * This controller is responsible for:
 * 1. Creating new API keys for programmatic access
 * 2. Retrieving all API keys for the current team
 * 3. Managing API key permissions and capabilities
 *
 * API keys are essential for integrating Kibamail with external systems and
 * automating workflows without requiring user interaction. They're commonly used for:
 * - Custom integrations with other marketing tools
 * - Automated data imports/exports
 * - Scheduled campaign management
 * - Webhook authentication
 */
export class ApiKeysController extends BaseController {
  constructor(
    private accessTokenRepository = container.make(AccessTokenRepository),
    private app = makeApp(),
  ) {
    super()

    // Define routes for API key management
    this.app.defineRoutes(
      [
        ['POST', '/', this.create.bind(this)],
        ['GET', '/', this.index.bind(this)],
        ['DELETE', '/:id', this.destroy.bind(this)],
      ],
      {
        prefix: 'auth/api-keys',
      },
    )
  }

  /**
   * Creates a new API key for the current team.
   *
   * This endpoint generates a secure API key that can be used for programmatic
   * access to the Kibamail API. The API key is associated with the current team
   * and inherits the permissions of the team.
   *
   * API keys are essential for integrating Kibamail with external systems and
   * automating workflows without requiring user interaction. They're commonly used for:
   * - Custom integrations with other marketing tools
   * - Automated data imports/exports
   * - Scheduled campaign management
   * - Webhook authentication
   *
   * @param ctx - The Hono request context containing the current team
   * @returns JSON response containing the newly generated API key
   */
  async create(ctx: HonoContext) {
    this.ensureCanManage(ctx)

    const data = await this.validate(ctx, CreateTeamAccessTokenSchema)

    const { apiKey } = await container
      .make(CreateTeamAccessTokenAction)
      .handle(ctx.get('team').id, data)

    return this.response(ctx).json({ apiKey }).send()
  }

  /**
   * Retrieves all API keys for the current team.
   *
   * This endpoint returns a list of all API keys associated with the current team,
   * including their names, capabilities, creation dates, and last usage information.
   * This allows team administrators to monitor and manage their API keys effectively.
   *
   * The response includes:
   * - API key name and preview (first 8 characters)
   * - Capabilities/permissions granted to the key
   * - Creation and last usage timestamps
   * - Unique identifier for management operations
   *
   * @param ctx - The Hono request context containing the current team
   * @returns JSON response containing the list of API keys
   */
  async index(ctx: HonoContext) {
    this.ensureCanManage(ctx)

    const teamId = ctx.get('team')?.id

    const apiKeys = await this.accessTokenRepository.accesstokens().findAllForTeam(teamId)

    const formattedApiKeys = apiKeys.map((apiKey) => ({
      name: apiKey.name,
      capabilities: apiKey.capabilities,
      createdAt: apiKey.createdAt,
      lastUsedAt: apiKey.lastUsedAt,
      id: apiKey.id,
      preview: apiKey.preview,
    }))

    return this.response(ctx).json({ apiKeys: formattedApiKeys }).send()
  }

  /**
   * Deletes an API key for the current team.
   *
   * This endpoint permanently removes an API key, immediately revoking access
   * for any systems using this key. This action cannot be undone, and any
   * applications or integrations using this API key will lose access.
   *
   * Only team administrators and managers can delete API keys to ensure
   * proper access control and prevent unauthorized key management.
   *
   * @param ctx - The Hono request context containing the API key ID and current team
   * @returns JSON response confirming the deletion
   */
  async destroy(ctx: HonoContext) {
    this.ensureCanManage(ctx)

    const id = ctx.req.param('id')
    const teamId = ctx.get('team')?.id

    await this.validate(ctx, DeleteTeamAccessTokenSchema, {
      id,
    })

    const apiKey = await this.accessTokenRepository
      .accesstokens()
      .findOne(eq(accessTokens.id, id))

    if (!apiKey) {
      throw E_VALIDATION_FAILED([
        {
          message: 'API key not found.',
          field: 'id',
        },
      ])
    }

    if (apiKey.teamId !== teamId) {
      throw E_UNAUTHORIZED('This API key does not belong to your team.')
    }

    // Delete the API key using the action
    await container.make(DeleteTeamAccessTokenAction).handle(id)

    return this.response(ctx).json({ id: id }).send()
  }
}
