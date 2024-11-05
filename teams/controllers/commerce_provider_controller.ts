import { makeApp } from "@/shared/container/index.js"
import { BaseController } from "@/shared/controllers/base_controller.js"

export class CommerceProviderController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    // endpoint to connect a provider. must be stripe, paystack or flutterwave.
    // in case of stripe:

    // 1. create an express account
    // 2. generate express account link

    // 3. redirect user to express account link
    // 4. register webhooks. listen to when user successfully completes stripe set up process.

    // in case of paystack:
    // do everything like with stripe, but use the kibamail MoR open source APIs to handle account payouts, etc.
  }
}
