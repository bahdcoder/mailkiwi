import { eq } from "drizzle-orm"

import { UpdateWebsitePage } from "@/database/database_schema_types.js"
import { websitePages } from "@/database/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class WebsitePageRepository extends BaseRepository {
  constructor(protected database = makeDatabase()) {
    super()
  }

  async findById(websitePageId: string) {
    const [websitePage] = await this.database
      .select()
      .from(websitePages)
      .where(eq(websitePages.id, websitePageId))
      .limit(1)

    return websitePage
  }

  async updateById(websitePageId: string, payload: UpdateWebsitePage) {
    await this.database
      .update(websitePages)
      .set(payload)
      .where(eq(websitePages.id, websitePageId))

    return { id: websitePageId }
  }
}
