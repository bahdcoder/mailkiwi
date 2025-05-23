import type { CreateWebsitePageDto } from '#root/core/websites/dto/create_website_page_dto.js'
import { eq } from 'drizzle-orm'

import type {
  UpdateWebsitePage,
  WebsitePage,
} from '#root/database/database_schema_types.js'
import { websitePages } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'

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

  async publish(websitePage: WebsitePage) {
    await this.database
      .update(websitePages)
      .set({
        publishedAt: new Date(),
        websiteContent: websitePage.draftWebsiteContent,
      })
      .where(eq(websitePages.id, websitePage.id))

    return { id: websitePage.id }
  }

  async unpublish(websitePage: WebsitePage) {
    await this.database
      .update(websitePages)
      .set({
        publishedAt: null,
      })
      .where(eq(websitePages.id, websitePage.id))

    return { id: websitePage.id }
  }

  async create(payload: CreateWebsitePageDto, websiteId: string) {
    const id = this.cuid()

    await this.database.insert(websitePages).values({
      ...payload,
      id,
      websiteId,
      websiteContent: payload.draftWebsiteContent,
    })

    return { id }
  }

  async updateById(websitePageId: string, payload: UpdateWebsitePage) {
    await this.database
      .update(websitePages)
      .set(payload)
      .where(eq(websitePages.id, websitePageId))

    return { id: websitePageId }
  }
}
