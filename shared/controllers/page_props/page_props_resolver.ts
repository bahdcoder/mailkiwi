import { type DefaultPageProps } from "@/pages/types/page-context.js"
import { eq } from "drizzle-orm"

import { BroadcastGroupRepository } from "@/broadcasts/repositories/broadcast_group_repository.js"
import { BroadcastRepository } from "@/broadcasts/repositories/broadcast_repository.js"

import { GetContactsAction } from "@/audiences/actions/contacts/get_contacts_action.js"
import { SegmentRepository } from "@/audiences/repositories/segment_repository.js"

import { segments as segmentsTable } from "@/database/schema.js"

import { route } from "@/shared/routes/route_aliases.js"
import { HonoContext } from "@/shared/server/types.js"

import { container } from "@/utils/typi.js"

export class PagePropsResolver {
  protected DEFAULT_PROPS_FETCHERS: Record<
    string,
    (ctx: HonoContext, defaultPageProps: DefaultPageProps) => Promise<Record<string, any>>
  > = {
    async [route("engage_contacts")](ctx, { audience }) {
      const [contacts, segments] = await Promise.all([
        container
          .make(GetContactsAction)
          .handle(
            audience.id,
            ctx.req.query("segmentId") as string,
            Number.parseInt(ctx.req.query("page") ?? "1"),
            Number.parseInt(ctx.req.query("perPage") ?? "100"),
          ),
        container
          .make(SegmentRepository)
          .segments()
          .findAll(eq(segmentsTable.audienceId, audience.id)),
      ])

      return { contacts, segments }
    },

    async [route("engage")](_ctx, { team }) {
      const groups = await container
        .make(BroadcastGroupRepository)
        .findWithBroadcastsForTeam(team.id)

      return {
        groups: groups.map((group) => ({
          ...group,
          broadcasts: group.broadcasts.map((broadcast) => ({
            ...broadcast,
            sendAt: broadcast.sendAt ? broadcast.sendAt.toISOString() : null,
          })),
        })),
      }
    },
  }

  protected async dynamicPropFetchers(pathname: string, { audience }: DefaultPageProps) {
    if (pathname.includes("/w/engage/broadcasts")) {
      const broadcastId = pathname
        .split("/w/engage/broadcasts/")?.[1]
        ?.split("/composer")?.[0]

      const broadcast = await container
        .make(BroadcastRepository)
        .findByIdWithAbTestVariants(broadcastId)
      const segments = await container
        .make(SegmentRepository)
        .segments()
        .findAll(eq(segmentsTable.audienceId, audience.id))

      return {
        broadcast: {
          ...broadcast,
          sendAt: broadcast?.sendAt ? broadcast.sendAt.toISOString() : null,
        },
        segments,
      }
    }

    return {}
  }

  handle = async (ctx: HonoContext, defaultPageProps: DefaultPageProps) => {
    let pathname = new URL(ctx.req.url)?.pathname

    pathname = pathname.split("/index.pageContext.json")?.[0]

    const pagePropsLoader = this.DEFAULT_PROPS_FETCHERS[pathname]

    if (pagePropsLoader) {
      const pageProps = await pagePropsLoader(ctx, defaultPageProps)

      return pageProps
    }

    const dynamicPageProps = await this.dynamicPropFetchers(pathname, defaultPageProps)

    return dynamicPageProps
  }
}
