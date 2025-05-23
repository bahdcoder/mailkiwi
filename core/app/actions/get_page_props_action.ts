import type { HonoContext } from '#root/core/shared/server/types.js'

export class GetPagePropsAction {
  async handle(ctx: HonoContext) {
    const path = ctx.req.path
    const queries = ctx.req.queries()
    const routePath = ctx.req.routePath

    const defaultPageProps = {
      user: ctx.get('user'),
      team: ctx.get('team'),
    }

    switch (path) {
      case '/about':
      case '/about/index.pageContext.json':
        return {
          ...defaultPageProps,
          defaultCount: 102,
        }
      default:
        return defaultPageProps
    }
  }
}
