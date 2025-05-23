import type { DefaultPageProps } from '#root/pages/types/page-context.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

export abstract class PagePropsResolverContract {
  static get regex(): (RegExp | string | ((pathname: string) => boolean))[] {
    throw new Error('Regex is not defined for this resolver.')
  }

  abstract resolve(
    pathname: string,
    defaultProps: DefaultPageProps,
    ctx: HonoContext,
  ): Promise<object>
}
