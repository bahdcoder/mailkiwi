import { CreateNewsletterWebsitePageDto } from "@/letters/dto/create_newsletter_website_page_dto.js"
import { eq } from "drizzle-orm"

import {
  UpdateWebsitePage,
  WebsitePage,
} from "@/database/database_schema_types.js"
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

  async create(
    payload: CreateNewsletterWebsitePageDto,
    newsletterWebsiteId: string,
  ) {
    const id = this.cuid()

    await this.database.insert(websitePages).values({
      ...payload,
      id,
      newsletterWebsiteId,
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
