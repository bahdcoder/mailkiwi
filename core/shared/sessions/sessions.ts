import { randomBytes } from 'node:crypto'
import { appEnv } from '#root/core/app/env/app_env.js'
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie'

import type { HonoContext } from '#root/core/shared/server/types.js'
import {
  type RedisSessionData,
  RedisSessionStore,
} from '#root/core/shared/sessions/stores/redis_session_store.js'

import { container } from '#root/core/utils/typi.js'

export class Session {
  protected SESSION_COOKIE_NAME = 'session'
  protected CONTACT_SESSION_COOKIE_NAME = 'contact_session'

  constructor(
    protected encryptionKey = appEnv.APP_KEY.release(),
    protected sessionStore = container.make(RedisSessionStore),
  ) {}

  async getContact(ctx: HonoContext) {
    return this.getUser(ctx, 'contact')
  }

  protected getCookiePrefix() {
    return appEnv.isProdOrStaging ? '__Secure-' : ''
  }

  async getCurrentSessionId(ctx: HonoContext, type: 'contact' | 'user' = 'user') {
    const sessionId = await getSignedCookie(
      ctx,
      this.encryptionKey,
      `${this.getCookiePrefix()}${
        type === 'contact' ? this.CONTACT_SESSION_COOKIE_NAME : this.SESSION_COOKIE_NAME
      }`,
    )

    return sessionId
  }

  async getUser(ctx: HonoContext, type: 'contact' | 'user' = 'user') {
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

  async clearForUser(ctx: HonoContext, type: 'contact' | 'user' = 'user') {
    const sessionId = await this.getCurrentSessionId(ctx, type)

    if (!sessionId) {
      return
    }

    deleteCookie(
      ctx,
      type === 'contact' ? this.CONTACT_SESSION_COOKIE_NAME : this.SESSION_COOKIE_NAME,
    )

    await this.sessionStore.remove(sessionId)
  }

  async createForContact(ctx: HonoContext, contactId: string) {
    return this.createForUser(ctx, { userId: contactId }, 'contact')
  }

  async updateCurrentSessionTeamId(ctx: HonoContext, teamId: string) {
    const sessionId = await this.getCurrentSessionId(ctx, 'user')

    if (!sessionId) {
      return
    }

    await this.sessionStore.update(sessionId, 'currentTeamId', teamId)
  }

  async createForUser(
    ctx: HonoContext,
    data: Pick<RedisSessionData, 'userId' | 'currentTeamId' | 'userAgent'>,
    type: 'user' | 'contact' = 'user',
  ) {
    const sessionId = randomBytes(32).toString('hex')

    await this.sessionStore.create(data.userId, sessionId, {
      ip: ctx.req.header('x-forwarded-for') || ctx.req.header('x-real-ip'),
      userAgent: ctx.req.header('user-agent'),
      ...data,
    })

    await setSignedCookie(
      ctx,
      type === 'contact' ? this.CONTACT_SESSION_COOKIE_NAME : this.SESSION_COOKIE_NAME,
      sessionId,
      this.encryptionKey,
      {
        sameSite: 'Lax',
        prefix: appEnv.isProdOrStaging ? 'secure' : undefined,
        secure: appEnv.isProdOrStaging,
        httpOnly: true,
        path: '/',
        maxAge: 3600 * 24 * 30, // 30 days
      },
    )

    return { sessionId }
  }
}
