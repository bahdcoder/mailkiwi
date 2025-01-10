import { type DefaultPageProps } from "@/pages/types/page-context.js"

import { GetContactsAction } from "@/audiences/actions/contacts/get_contacts_action.js"
import { ContactController } from "@/audiences/controllers/contact_controller.js"

import { route } from "@/shared/routes/route_aliases.js"
import { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class PagePropsResolver {
  protected DEFAULT_PROPS_FETCHERS = {
    [route("engage_contacts")]: async function (
      ctx: HonoContext,
      { audience }: DefaultPageProps,
    ) {
      const contacts = await container
        .make(GetContactsAction)
        .handle(
          audience.id,
          ctx.req.query("segmentId") as string,
          Number.parseInt(ctx.req.query("page") ?? "1"),
          Number.parseInt(ctx.req.query("perPage") ?? "100"),
        )

      return { contacts }
    },
  }

  handle = async (ctx: HonoContext, defaultPageProps: DefaultPageProps) => {
    let pathname = new URL(ctx.req.url)?.pathname

    pathname = pathname.split("/index.pageContext.json")?.[0]

    const pagePropsLoader = this.DEFAULT_PROPS_FETCHERS[pathname]

    if (pagePropsLoader) {
      const pageProps = await pagePropsLoader(ctx, defaultPageProps)

      return pageProps
    }

    return {}
  }
}
