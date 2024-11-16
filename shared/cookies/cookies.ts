import { appEnv } from "@/app/env/app_env.js"
import { getSignedCookie, setSignedCookie } from "hono/cookie"

import { HonoContext } from "@/shared/server/types.js"
import { Encryption } from "@/shared/utils/encryption/encryption.js"

export class Session {
  protected SESSION_COOKIE_NAME = "session"
  protected CONTACT_SESSION_COOKIE_NAME = "contact_session"

  constructor(protected encryptionKey = appEnv.APP_KEY.release()) {}

  async getContact(ctx: HonoContext) {
    return this.getUser(ctx, "contact")
  }

  async getUser(ctx: HonoContext, type: "contact" | "user" = "user") {
    const sessionData = await getSignedCookie(
      ctx,
      this.encryptionKey,
      "__Secure-" +
        (type === "contact"
          ? this.CONTACT_SESSION_COOKIE_NAME
          : this.SESSION_COOKIE_NAME),
    )

    if (!sessionData) {
      return null
    }

    const decryptedSessionData = new Encryption(appEnv.APP_KEY).decrypt(
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

  async createForContact(ctx: HonoContext, contactId: string) {
    return this.createForUser(ctx, contactId, "contact")
  }

  async createForUser(
    ctx: HonoContext,
    userId: string,
    type: "user" | "contact" = "user",
  ) {
    const sessionData = new Encryption(appEnv.APP_KEY).encrypt(
      JSON.stringify({ userId }),
    )

    await setSignedCookie(
      ctx,
      type === "contact"
        ? this.CONTACT_SESSION_COOKIE_NAME
        : this.SESSION_COOKIE_NAME,
      sessionData.release(),
      this.encryptionKey,
      {
        sameSite: "Strict",
        prefix: "secure",
        secure: appEnv.isProd,
        httpOnly: true,
        path: "/",
      },
    )
  }
}
