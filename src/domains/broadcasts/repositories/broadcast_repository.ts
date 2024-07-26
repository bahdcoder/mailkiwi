import type { CreateBroadcastDto } from '@/domains/broadcasts/dto/create_broadcast_dto.js'
import type { UpdateBroadcastDto } from '@/domains/broadcasts/dto/update_broadcast_dto.js'
import { BaseRepository } from '@/domains/shared/repositories/base_repository.js'
import { makeDatabase } from '@/infrastructure/container.ts'
import type { DrizzleClient } from '@/infrastructure/database/client.ts'
import { broadcasts } from '@/infrastructure/database/schema/schema.js'
import type { UpdateSetBroadcastInput } from '@/infrastructure/database/schema/types.ts'
import { eq } from 'drizzle-orm'

export class BroadcastRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async create(data: CreateBroadcastDto, teamId: string) {
    const id = this.cuid()
    await this.database.insert(broadcasts).values({ ...data, id, teamId })

    return { id }
  }

  async update(
    id: string,
    { sendAt, ...payload }: Partial<UpdateSetBroadcastInput>,
  ) {
    await this.database
      .update(broadcasts)
      .set({
        ...payload,
        ...(sendAt ? { sendAt: new Date(sendAt as string) } : {}),
      })
      .where(eq(broadcasts.id, id))
    return { id }
  }

  async delete(id: string) {
    await this.database.delete(broadcasts).where(eq(broadcasts.id, id))

    return { id }
  }

  async findById(id: string) {
    return this.database.query.broadcasts.findFirst({
      where: eq(broadcasts.id, id),
    })
  }

  async findAll() {
    return this.database.query.broadcasts.findMany()
  }
}
