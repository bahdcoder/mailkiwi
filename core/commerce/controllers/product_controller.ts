import { CreateProductSchema } from '#root/core/commerce/dto/create_product_dto.js'
import { InitialiseProductPaymentSchema } from '#root/core/commerce/dto/initialise_product_payment_dto.js'
import { ProductRepository } from '#root/core/commerce/repositories/product_repository.js'
import { CommerceProviderTool } from '#root/core/commerce/tools/commerce_provider_tool.js'

import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import { type Audience, Product } from '#root/database/database_schema_types.js'

import { E_VALIDATION_FAILED } from '#root/core/http/responses/errors.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

import { container } from '#root/core/utils/typi.js'

/**
 * ProductController handles API endpoints for managing commerce products.
 *
 * This controller is responsible for the e-commerce functionality in Kibamail,
 * providing endpoints to create products and process payments. It enables teams
 * to monetize their audiences by selling digital products, subscriptions, or
 * other offerings through the platform.
 *
 * The controller integrates with various payment providers through the
 * CommerceProviderTool, allowing teams to choose their preferred payment
 * processor while maintaining a consistent API for the rest of the application.
 */
export class ProductController extends BaseController {
  constructor(
    protected app = makeApp(),
    protected productRepository = container.make(ProductRepository),
  ) {
    super()

    // Define routes for creating products within an audience
    this.app.defineRoutes([['POST', '/', this.create.bind(this)]], {
      prefix: '/audiences/:audienceId/products',
    })

    // Define routes for processing payments for products
    this.app.defineRoutes(
      [
        // Initialize a payment for a product
        ['POST', '/payments/initialize', this.initializePayment.bind(this)],
        // Handle the callback after payment completion
        ['GET', '/payments/callback', this.initializePaymentCallback.bind(this)],
      ],
      {
        prefix: '/products/:productId/',
        middleware: [],
      },
    )
  }

  /**
   * Creates a new product for an audience.
   *
   * This method implements the product creation process:
   * 1. Ensures the user has access to the team and audience
   * 2. Verifies that the team has connected a commerce provider
   * 3. Validates the product creation data
   * 4. Creates the product record
   *
   * Products are associated with both a team (for payment processing)
   * and an audience (for targeting). This allows teams to create different
   * products for different segments of their user base.
   *
   * @param ctx - The HTTP context containing the request data
   * @returns JSON response with the product ID
   * @throws E_VALIDATION_FAILED if the team hasn't connected a commerce provider
   */
  async create(ctx: HonoContext) {
    // Ensure the user has access to the team
    const team = this.ensureTeam(ctx)
    // Ensure the audience exists and the user has access to it
    const audience = await this.ensureExists<Audience>(ctx, 'audienceId')

    // Verify that the team has connected a commerce provider
    if (!team.commerceProviderConfirmedAt) {
      return E_VALIDATION_FAILED([
        {
          message:
            'Before you create a commerce product, You must first connect a commerce provider such as stripe, paypal, flutterwave, paystack.',
        },
      ])
    }

    // Validate the product creation data
    const payload = await this.validate(ctx, CreateProductSchema)

    // Create the product record
    const { id } = await this.productRepository
      .products()
      .create({ ...payload, audienceId: audience.id, teamId: team.id })

    return ctx.json({ id })
  }

  /**
   * Ensures a product exists and its team has a connected commerce provider.
   *
   * This helper method performs several validation steps:
   * 1. Verifies that the product exists in the database
   * 2. Retrieves the team that owns the product
   * 3. Ensures the team has a properly configured commerce provider
   *
   * This validation is critical for payment endpoints, as it ensures that
   * payments can only be processed for valid products with properly configured
   * payment processing.
   *
   * @param ctx - The HTTP context containing the product ID
   * @returns Object containing the product and its team
   * @throws E_VALIDATION_FAILED if the product doesn't exist or the team hasn't connected a commerce provider
   */
  private async ensureProductExists(ctx: HonoContext) {
    // Retrieve the product from the database
    const product = await container
      .make(ProductRepository)
      .products()
      .findById(ctx.req.param('productId'))

    // Verify that the product exists
    if (!product) {
      throw E_VALIDATION_FAILED([
        {
          message: 'Invalid productId provided.',
          field: 'productId',
        },
      ])
    }

    // Retrieve the team that owns the product
    const team = await container.make(TeamRepository).teams().findById(product.teamId)

    // Ensure the team has a properly configured commerce provider
    if (
      !team.commerceProvider ||
      !team.commerceProviderAccountId ||
      !team.commerceProviderConfirmedAt
    ) {
      throw E_VALIDATION_FAILED([
        {
          message: 'You must connect a commerce provider before you can make a payment',
        },
      ])
    }

    return { product, team }
  }

  /**
   * Initializes a payment process for a product.
   *
   * This method implements the payment initialization process:
   * 1. Ensures the product exists and its team has a connected commerce provider
   * 2. Validates the payment initialization data
   * 3. Creates the appropriate commerce provider implementation
   * 4. Initializes the payment process with the provider
   * 5. Returns the payment URL to redirect the customer to
   *
   * This endpoint is typically called when a customer clicks a "Buy Now" button,
   * initiating the checkout process. The response includes a URL that the
   * customer should be redirected to in order to complete their payment.
   *
   * @param ctx - The HTTP context containing the request data
   * @returns JSON response with the payment URL
   * @throws E_VALIDATION_FAILED if the product doesn't exist or the team hasn't connected a commerce provider
   */
  async initializePayment(ctx: HonoContext) {
    // Ensure the product exists and its team has a connected commerce provider
    const { team, product } = await this.ensureProductExists(ctx)

    // Validate the payment initialization data
    const payload = await this.validate(ctx, InitialiseProductPaymentSchema)

    // Create the appropriate commerce provider implementation
    const commerceProvider = container
      .make(CommerceProviderTool)
      .createProvider(team.commerceProvider || 'stripe')

    // Initialize the payment process with the provider
    const data = await commerceProvider.initialiseOneTimePayment({
      email: payload.email,
      accountId: team.commerceProviderAccountId as string,
      product,
    })

    // Return the payment URL to redirect the customer to
    return ctx.json(data)
  }

  /**
   * Handles the callback after a payment is completed.
   *
   * This method implements the payment confirmation process:
   * 1. Ensures the product exists and its team has a connected commerce provider
   * 2. Creates the appropriate commerce provider implementation
   * 3. Confirms the payment status with the provider
   * 4. Returns the payment success status
   *
   * This endpoint is called by the payment provider after the customer completes
   * the checkout process. It verifies that the payment was successful and updates
   * the system accordingly.
   *
   * Note: The current implementation returns a JSON response, but future versions
   * should redirect the customer to a success or error page based on the payment status.
   *
   * @param ctx - The HTTP context containing the callback data
   * @returns JSON response with the payment success status
   * @throws E_VALIDATION_FAILED if the product doesn't exist or the team hasn't connected a commerce provider
   */
  async initializePaymentCallback(ctx: HonoContext) {
    // Ensure the product exists and its team has a connected commerce provider
    const { team, product } = await this.ensureProductExists(ctx)

    // Create the appropriate commerce provider implementation
    const commerceProvider = container
      .make(CommerceProviderTool)
      .createProvider(team.commerceProvider || 'stripe')

    // Confirm the payment status with the provider
    const { success } = await commerceProvider.confirmOneTimePayment({
      reference: ctx.req.query('reference') as string,
      product,
    })

    // TODO: Figure out how to redirect in the case the user is using a newsletter website.
    // if success, redirect to success page.
    // if error, redirect to error page.
    return ctx.json({ success })
  }
}
