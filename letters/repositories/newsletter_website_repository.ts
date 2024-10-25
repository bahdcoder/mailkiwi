import { eq } from "drizzle-orm"

import {
  InsertNewsletterWebsite,
  UpdateNewsletterWebsite,
  UpdateWebsitePage,
} from "@/database/database_schema_types.js"
import { newsletterWebsites, websitePages } from "@/database/schema.js"
import { hasMany } from "@/database/utils/relationships.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class NewsletterWebsiteRepository extends BaseRepository {
  constructor(protected database = makeDatabase()) {
    super()
  }

  protected hasManyPages = hasMany(this.database, {
    relationName: "pages",
    from: newsletterWebsites,
    to: websitePages,
    primaryKey: newsletterWebsites.id,
    foreignKey: websitePages.newsletterWebsiteId,
  })

  async create(payload: InsertNewsletterWebsite) {
    const id = this.cuid()
    const homePageId = this.cuid()

    await this.database.transaction(async function (trx) {
      await trx.insert(newsletterWebsites).values({ ...payload, id })

      await trx.insert(websitePages).values({
        path: "/",
        id: homePageId,
        newsletterWebsiteId: id,
        publishedAt: new Date(),
        websiteContent: { type: "doc", content: [] },
        draftWebsiteContent: { type: "doc", content: [] },
      })
    })

    return { id, homePageId }
  }

  async findById(newsletterWebsiteId: string) {
    const [newsletterWebsite] = await this.database
      .select()
      .from(newsletterWebsites)
      .where(eq(newsletterWebsites.id, newsletterWebsiteId))
      .limit(1)

    return newsletterWebsite
  }

  async findBySlugWithPages(slug: string) {
    const [newsletterWebsite] = await this.hasManyPages((query) =>
      query.where(eq(newsletterWebsites.slug, slug)),
    )

    return newsletterWebsite
  }

  async findByIdWithPages(newsletterWebsiteId: string) {
    const [newsletterWebsite] = await this.hasManyPages((query) =>
      query.where(eq(newsletterWebsites.id, newsletterWebsiteId)),
    )

    return newsletterWebsite
  }

  async findByAudienceId(audienceId: string) {
    const [newsletterWebsite] = await this.database
      .select()
      .from(newsletterWebsites)
      .where(eq(newsletterWebsites.audienceId, audienceId))
      .limit(1)

    return newsletterWebsite
  }

  async updateById(
    newsletterWebsiteId: string,
    payload: UpdateNewsletterWebsite,
  ) {
    await this.database
      .update(newsletterWebsites)
      .set(payload)
      .where(eq(newsletterWebsites.id, newsletterWebsiteId))

    return { id: newsletterWebsiteId }
  }
}
