import { GetContactsAction } from '#root/core/audiences/actions/contacts/get_contacts_action.js'
import { SegmentRepository } from '#root/core/audiences/repositories/segment_repository.js'
import { segments as segmentsTable } from '#root/database/schema.js'
import type { DefaultPageProps } from '#root/pages/types/page-context.js'
import { PagePropsResolverContract } from '#root/core/shared/controllers/page_props/page_props_resolver_contract.js'
import { route } from '#root/core/shared/routes/route_aliases.js'
import type { HonoContext } from '#root/core/shared/server/types.js'
import { container } from '#root/core/utils/typi.js'
import { eq } from 'drizzle-orm'

export class EngageContactsPropsResolver extends PagePropsResolverContract {
  static get regex() {
    return [new RegExp(route('engage_contacts'))]
  }

  async resolve(_pathname: string, { audience }: DefaultPageProps, ctx: HonoContext) {
    const [contacts, segments] = await Promise.all([
      container
        .make(GetContactsAction)
        .handle(
          audience.id,
          ctx.req.query('segmentId') as string,
          Number.parseInt(ctx.req.query('page') ?? '1'),
          Number.parseInt(ctx.req.query('perPage') ?? '100'),
        ),
      container
        .make(SegmentRepository)
        .segments()
        .findAll(eq(segmentsTable.audienceId, audience.id)),
    ])

    return { contacts, segments }
  }
}
