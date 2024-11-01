import { appEnv } from "@/app/env/app_env.js"
import { and, eq } from "drizzle-orm"

import {
  InsertNewsletterWebsite,
  UpdateNewsletterWebsite,
  UpdateWebsitePage,
} from "@/database/database_schema_types.js"
import { newsletterWebsites, websitePages } from "@/database/schema.js"
import { hasMany } from "@/database/utils/relationships.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"
import { Encryption } from "@/shared/utils/encryption/encryption.js"

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

  async findBySlugAndToken(slug: string, acmeChallengeToken: string) {
    const [newsletterWebsite] = await this.database
      .select({
        websiteSslCertChallengeKeyAuthorization:
          newsletterWebsites.websiteSslCertChallengeKeyAuthorization,
      })
      .from(newsletterWebsites)
      .where(
        and(
          eq(newsletterWebsites.slug, slug),
          eq(
            newsletterWebsites.websiteSslCertChallengeToken,
            acmeChallengeToken,
          ),
        ),
      )
      .limit(1)

    if (
      newsletterWebsite &&
      newsletterWebsite.websiteSslCertChallengeKeyAuthorization
    ) {
      newsletterWebsite.websiteSslCertChallengeKeyAuthorization =
        new Encryption(appEnv.APP_KEY)
          .decrypt(
            newsletterWebsite.websiteSslCertChallengeKeyAuthorization as string,
          )
          ?.release() as string
    }

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
    const encryption = new Encryption(appEnv.APP_KEY)
    if (payload.websiteSslCertChallengeKeyAuthorization) {
      payload.websiteSslCertChallengeKeyAuthorization = encryption
        .encrypt(payload.websiteSslCertChallengeKeyAuthorization as string)
        .release()
    }

    if (payload.websiteSslCertKey) {
      payload.websiteSslCertKey = encryption
        .encrypt(payload.websiteSslCertKey as string)
        .release()
    }

    if (payload.websiteSslCertSecret) {
      payload.websiteSslCertSecret = encryption
        .encrypt(payload.websiteSslCertSecret as string)
        .release()
    }

    await this.database
      .update(newsletterWebsites)
      .set(payload)
      .where(eq(newsletterWebsites.id, newsletterWebsiteId))

    return { id: newsletterWebsiteId }
  }
}
