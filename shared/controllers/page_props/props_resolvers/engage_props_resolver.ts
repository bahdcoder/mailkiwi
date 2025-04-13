import { BroadcastGroupRepository } from '@/broadcasts/repositories/broadcast_group_repository.js'
import { BroadcastRepository } from '@/broadcasts/repositories/broadcast_repository.js'
import { broadcastGroups } from '@/database/schema.js'
import { DefaultPageProps } from '@/pages/types/page-context.js'
import { PagePropsResolverContract } from '@/shared/controllers/page_props/page_props_resolver_contract.js'
import { route } from '@/shared/routes/route_aliases.js'
import { container } from '@/utils/typi.js'
import { eq } from 'drizzle-orm'

export class EngagePropsResolver extends PagePropsResolverContract {
  static get regex() {
    return [route('engage')]
  }

  async resolve(_pathname: string, { team }: DefaultPageProps) {
    const groups = await container
      .make(BroadcastGroupRepository)
      .groups()
      .findAll(eq(broadcastGroups.teamId, team.id))

    const broadcasts = await container.make(BroadcastRepository).findAllForTeam(team.id)

    return {
      groups,
      broadcasts: broadcasts.map((broadcast) => ({
        ...broadcast,
        sendAt: broadcast.sendAt ? broadcast.sendAt.toISOString() : null,
      })),
    }
  }
}
