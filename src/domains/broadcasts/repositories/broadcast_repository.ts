import { eq } from "drizzle-orm"
import { BaseRepository } from "@/domains/shared/repositories/base_repository.js"
import { broadcasts } from "@/infrastructure/database/schema/schema.js"
import { CreateBroadcastDto } from "@/domains/broadcasts/dto/create_broadcast_dto.js"
import { UpdateBroadcastDto } from "@/domains/broadcasts/dto/update_broadcast_dto.js"
import { DrizzleClient } from "@/infrastructure/database/client.ts"
import { makeDatabase } from "@/infrastructure/container.ts"

export class BroadcastRepository extends BaseRepository {
  constructor(protected database: DrizzleClient = makeDatabase()) {
    super()
  }

  async create(data: CreateBroadcastDto, teamId: string) {
    const id = this.cuid()
    await this.database.insert(broadcasts).values({ ...data, id, teamId })

    return { id }
  }

  async update(id: string, { sendAt, ...data }: UpdateBroadcastDto) {
    await this.database
      .update(broadcasts)
      .set({ ...data, sendAt: sendAt ? new Date(sendAt) : undefined })
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
