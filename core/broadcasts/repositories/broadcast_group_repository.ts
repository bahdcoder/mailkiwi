import { eq } from 'drizzle-orm'

import {
  broadcastGroups as broadcastGroupsTable,
  broadcasts as broadcastsTable,
} from '#root/database/schema.js'
import { hasMany } from '#root/database/utils/relationships.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'

export class BroadcastGroupRepository extends BaseRepository {
  constructor(protected database = makeDatabase()) {
    super()
  }

  protected hasManyBroadcasts() {
    return hasMany(this.database, {
      from: broadcastGroupsTable,
      to: broadcastsTable,
      primaryKey: broadcastGroupsTable.id,
      foreignKey: broadcastsTable.broadcastGroupId,
      relationName: 'broadcasts',
    })
  }

  groups() {
    return this.crud(broadcastGroupsTable)
  }

  async findWithBroadcastsForTeam(teamId: string) {
    const broadcasts = await this.hasManyBroadcasts()((query) =>
      query.where(eq(broadcastGroupsTable.teamId, teamId)),
    )

    return broadcasts
  }
}
