type GetPagePropsCtx = {
  path: string
  routePath: string
  queries: Record<string, string[]>
}

export class GetPagePropsAction {
  async handle(ctx: GetPagePropsCtx) {
    switch (ctx.path) {
      case "/about":
      case "/about/index.pageContext.json":
        return {
          defaultCount: 102,
        }
      default:
        return {}
    }

    return {}
  }
}
