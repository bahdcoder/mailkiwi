import { makeApp } from "@/shared/container/index.js"
import { VikeController } from "@/shared/controllers/vike_controller.js"

export class Oauth2Controller extends VikeController {
  constructor(protected app = makeApp()) {
    super()

    // /auth/register/oauth2/:provider/authorize
    // /auth/register/oauth2/:provider/callback
    //
    // /auth/login/oauth2/:provider/authorize
    // /auth/login/oauth2/:provider/callback
  }
}
