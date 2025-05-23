import { BroadcastGroupRepository } from '#root/core/broadcasts/repositories/broadcast_group_repository.js'
import { BroadcastRepository } from '#root/core/broadcasts/repositories/broadcast_repository.js'
import { broadcastGroups } from '#root/database/schema.js'
import type { DefaultPageProps } from '#root/pages/types/page-context.js'
import { PagePropsResolverContract } from '#root/core/shared/controllers/page_props/page_props_resolver_contract.js'
import { route } from '#root/core/shared/routes/route_aliases.js'
import { container } from '#root/core/utils/typi.js'
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
