import { GetContactsAction } from '@/audiences/actions/contacts/get_contacts_action.js'
import { SegmentRepository } from '@/audiences/repositories/segment_repository.js'
import { segments as segmentsTable } from '@/database/schema.js'
import type { DefaultPageProps } from '@pages/types/page-context.js'
import { PagePropsResolverContract } from '@/shared/controllers/page_props/page_props_resolver_contract.js'
import { route } from '@/shared/routes/route_aliases.js'
import type { HonoContext } from '@/shared/server/types.js'
import { container } from '@/utils/typi.js'
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
