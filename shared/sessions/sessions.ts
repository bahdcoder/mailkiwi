import { appEnv } from "@/app/env/app_env.js"
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie"
import { randomBytes } from "node:crypto"

import { HonoContext } from "@/shared/server/types.js"
import { RedisSessionStore } from "@/shared/sessions/stores/redis_session_store.js"

import { container } from "@/utils/typi.js"

export class Session {
  protected SESSION_COOKIE_NAME = "session"
  protected CONTACT_SESSION_COOKIE_NAME = "contact_session"

  constructor(
    protected encryptionKey = appEnv.APP_KEY.release(),
    protected sessionStore = container.make(RedisSessionStore),
  ) {}

  async getContact(ctx: HonoContext) {
    return this.getUser(ctx, "contact")
  }

  async getCurrentSessionId(ctx: HonoContext, type: "contact" | "user" = "user") {
    const sessionId = await getSignedCookie(
      ctx,
      this.encryptionKey,
      "__Secure-" +
        (type === "contact"
          ? this.CONTACT_SESSION_COOKIE_NAME
          : this.SESSION_COOKIE_NAME),
    )

    return sessionId
  }

  async getUser(ctx: HonoContext, type: "contact" | "user" = "user") {
    const sessionId = await this.getCurrentSessionId(ctx, type)

    if (!sessionId) {
      return null
    }

    const session = await this.sessionStore.get(sessionId)

    if (!session) {
      return null
    }

    return session
  }

  async clearForUser(ctx: HonoContext, type: "contact" | "user" = "user") {
    const sessionId = await this.getCurrentSessionId(ctx, type)

    if (!sessionId) {
      return
    }

    deleteCookie(
      ctx,
      type === "contact" ? this.CONTACT_SESSION_COOKIE_NAME : this.SESSION_COOKIE_NAME,
    )

    await this.sessionStore.remove(sessionId)
  }

  async createForContact(ctx: HonoContext, contactId: string) {
    return this.createForUser(ctx, contactId, "contact")
  }

  async createForUser(
    ctx: HonoContext,
    userId: string,
    type: "user" | "contact" = "user",
  ) {
    const sessionId = randomBytes(32).toString("hex")

    await this.sessionStore.create(userId, sessionId, {
      ip: ctx.req.header("x-forwarded-for") || ctx.req.header("x-real-ip"),
      userAgent: ctx.req.header("user-agent"),
    })

    await setSignedCookie(
      ctx,
      type === "contact" ? this.CONTACT_SESSION_COOKIE_NAME : this.SESSION_COOKIE_NAME,
      sessionId,
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
