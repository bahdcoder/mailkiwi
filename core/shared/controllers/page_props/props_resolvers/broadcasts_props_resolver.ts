import { SegmentRepository } from '#root/core/audiences/repositories/segment_repository.js'
import { BroadcastRepository } from '#root/core/broadcasts/repositories/broadcast_repository.js'
import { segments as segmentsTable } from '#root/database/schema.js'
import type { DefaultPageProps } from '#root/pages/types/page-context.js'
import { PagePropsResolverContract } from '#root/core/shared/controllers/page_props/page_props_resolver_contract.js'
import { container } from '#root/core/utils/typi.js'
import { eq } from 'drizzle-orm'

export class BroadcastsPropsResolver extends PagePropsResolverContract {
  static get regex() {
    return [/\/w\/engage\/broadcasts/]
  }

  async resolve(pathname: string, defaultProps: DefaultPageProps) {
    const broadcastId = pathname
      .split('/w/engage/broadcasts/')?.[1]
      ?.split('/composer')?.[0]

    const broadcast = await container
      .make(BroadcastRepository)
      .findByIdWithAbTestVariants(broadcastId)
    const segments = await container
      .make(SegmentRepository)
      .segments()
      .findAll(eq(segmentsTable.audienceId, defaultProps.audience.id))

    return {
      broadcast: {
        ...broadcast,
        sendAt: broadcast?.sendAt ? broadcast.sendAt.toISOString() : null,
      },
      segments,
    }
  }
}
