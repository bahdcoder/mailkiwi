import { apiEnv } from "@/api/env/api_env.js"
import { getSignedCookie, setSignedCookie } from "hono/cookie"

import { HonoContext } from "@/shared/server/types.js"
import { Encryption } from "@/shared/utils/encryption/encryption.js"

export class Session {
  protected SESSION_COOKIE_NAME = "session"

  constructor(protected encryptionKey = apiEnv.APP_KEY.release()) {}

  async getUser(ctx: HonoContext) {
    const sessionData = await getSignedCookie(
      ctx,
      this.encryptionKey,
      "__Secure-" + this.SESSION_COOKIE_NAME,
    )

    if (!sessionData) {
      return null
    }

    const decryptedSessionData = new Encryption(apiEnv.APP_KEY).decrypt(
      sessionData,
    )

    if (!decryptedSessionData) {
      return null
    }

    try {
      return JSON.parse(decryptedSessionData.release()) as {
        userId: string
      }
    } catch (error) {
      return null
    }
  }

  async createForUser(ctx: HonoContext, userId: string) {
    const sessionData = new Encryption(apiEnv.APP_KEY).encrypt(
      JSON.stringify({ userId }),
    )

    await setSignedCookie(
      ctx,
      this.SESSION_COOKIE_NAME,
      sessionData.release(),
      this.encryptionKey,
      {
        sameSite: "Strict",
        prefix: "secure",
        secure: apiEnv.isProd,
        httpOnly: true,
        path: "/",
      },
    )
  }
}
