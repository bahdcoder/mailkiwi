import { SegmentRepository } from '@/audiences/repositories/segment_repository.js'
import { BroadcastRepository } from '@/broadcasts/repositories/broadcast_repository.js'
import { segments as segmentsTable } from '@/database/schema.js'
import { DefaultPageProps } from '@/pages/types/page-context.js'
import { PagePropsResolverContract } from '@/shared/controllers/page_props/page_props_resolver_contract.js'
import { container } from '@/utils/typi.js'
import { eq } from 'drizzle-orm'

export class BroadcastsPropsResolver extends PagePropsResolverContract {
  static get regex() {
    return [new RegExp('/w/engage/broadcasts')]
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
