import { CreateProductSchema } from '@/commerce/dto/create_product_dto.js'
import { InitialiseProductPaymentSchema } from '@/commerce/dto/initialise_product_payment_dto.js'
import { ProductRepository } from '@/commerce/repositories/product_repository.js'
import { CommerceProviderTool } from '@/commerce/tools/commerce_provider_tool.js'

import { TeamRepository } from '@/teams/repositories/team_repository.js'

import { type Audience, Product } from '@/database/database_schema_types.js'

import { E_VALIDATION_FAILED } from '@/http/responses/errors.js'

import { makeApp } from '@/shared/container/index.js'
import { BaseController } from '@/shared/controllers/base_controller.js'
import type { HonoContext } from '@/shared/server/types.js'

import { container } from '@/utils/typi.js'

export class ProductController extends BaseController {
  constructor(
    protected app = makeApp(),
    protected productRepository = container.make(ProductRepository),
  ) {
    super()

    this.app.defineRoutes([['POST', '/', this.create.bind(this)]], {
      prefix: '/audiences/:audienceId/products',
    })

    this.app.defineRoutes(
      [
        ['POST', '/payments/initialize', this.initializePayment.bind(this)],
        ['GET', '/payments/callback', this.initializePaymentCallback.bind(this)],
      ],
      {
        prefix: '/products/:productId/',
        middleware: [],
      },
    )
  }

  async create(ctx: HonoContext) {
    const team = this.ensureTeam(ctx)
    const audience = await this.ensureExists<Audience>(ctx, 'audienceId')

    if (!team.commerceProviderConfirmedAt) {
      return E_VALIDATION_FAILED([
        {
          message:
            'Before you create a commerce product, You must first connect a commerce provider such as stripe, paypal, flutterwave, paystack.',
        },
      ])
    }

    const payload = await this.validate(ctx, CreateProductSchema)

    const { id } = await this.productRepository
      .products()
      .create({ ...payload, audienceId: audience.id, teamId: team.id })

    return ctx.json({ id })
  }

  private async ensureProductExists(ctx: HonoContext) {
    const product = await container
      .make(ProductRepository)
      .products()
      .findById(ctx.req.param('productId'))

    if (!product) {
      throw E_VALIDATION_FAILED([
        {
          message: 'Invalid productId provided.',
          field: 'productId',
        },
      ])
    }

    const team = await container.make(TeamRepository).teams().findById(product.teamId)

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

  async initializePayment(ctx: HonoContext) {
    const { team, product } = await this.ensureProductExists(ctx)

    const payload = await this.validate(ctx, InitialiseProductPaymentSchema)

    const commerceProvider = container
      .make(CommerceProviderTool)
      .createProvider(team.commerceProvider || 'stripe')

    const data = await commerceProvider.initialiseOneTimePayment({
      email: payload.email,
      accountId: team.commerceProviderAccountId as string,
      product,
    })

    // we found the product, now we need to get the commerce provider
    return ctx.json(data)
  }

  async initializePaymentCallback(ctx: HonoContext) {
    const { team, product } = await this.ensureProductExists(ctx)

    // trxref, reference

    const commerceProvider = container
      .make(CommerceProviderTool)
      .createProvider(team.commerceProvider || 'stripe')

    const { success } = await commerceProvider.confirmOneTimePayment({
      reference: ctx.req.query('reference') as string,
      product,
    })

    // if success, redirect to success page.
    // if error, redirect to error page.
    // TODO: Figure out how to redirect in the case the user is using a newsletter website.
    return ctx.json({ success })
  }
}
