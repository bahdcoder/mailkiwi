import { UserSessionMiddleware } from '#root/core/auth/middleware/user_session_middleware.js'

import { makeApp } from '#root/core/shared/container/index.js'
import { BaseController } from '#root/core/shared/controllers/base_controller.js'

import { container } from '#root/core/utils/typi.js'

/**
 * WebsiteContactController manages contact interactions on websites.
 *
 * This controller will be responsible for:
 * 1. Managing contact profile updates from website interfaces
 * 2. Handling newsletter subscription preferences
 * 3. Processing subscription and unsubscription requests
 *
 * This controller enables contacts to manage their own information and
 * preferences through website interfaces, providing self-service capabilities
 * that improve user experience and reduce administrative overhead.
 */
export class WebsiteContactController extends BaseController {
  constructor(protected app = makeApp()) {
    super()

    // TODO: Implement the following endpoints:
    // - Update contact details
    // - Update contact preferences
    // - Subscribe to newsletter plan
    // - Unsubscribe from newsletter plan
    this.app.defineRoutes([], {
      middleware: [container.make(UserSessionMiddleware).handle],
    })
  }
}
