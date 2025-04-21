import { UserSessionMiddleware } from '@/auth/middleware/user_session_middleware.js'

import { makeApp } from '@/shared/container/index.js'
import { BaseController } from '@/shared/controllers/base_controller.js'

import { container } from '@/utils/typi.js'

export class WebsiteContactController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    // endpoint to update contact details
    // endpoint to update preferences for contact
    // endpoint to subscribe to a newsletter plan
    // endpoint to unsubscribe from a newsletter plan
    this.app.defineRoutes([], {
      middleware: [container.make(UserSessionMiddleware).handle],
    })
  }
}
