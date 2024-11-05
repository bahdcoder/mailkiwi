import { CreateProductSchema } from "@/commerce/dto/create_product_dto.js"
import { ProductRepository } from "@/commerce/repositories/product_repository.js"

import { E_VALIDATION_FAILED } from "@/http/responses/errors.js"

import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"
import { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class ProductController extends BaseController {
  constructor(
    protected app = makeApp(),
    protected productRepository = container.make(ProductRepository),
  ) {
    super()

    this.app.defineRoutes([["POST", "/", this.create.bind(this)]], {
      prefix: "/products",
    })
  }

  async create(ctx: HonoContext) {
    const team = this.ensureTeam(ctx)

    if (!team.commerceProviderConfirmedAt) {
      return E_VALIDATION_FAILED([
        {
          message:
            "Before you create a commerce product, You must first connect a commerce provider such as stripe, paypal, flutterwave, paystack.",
        },
      ])
    }

    const payload = await this.validate(ctx, CreateProductSchema)

    const { id } = await this.productRepository.products().create(payload)

    return ctx.json({ id })
  }
}
