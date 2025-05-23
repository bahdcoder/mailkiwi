import { appEnv } from '#root/core/app/env/app_env.js'
import { and, eq } from 'drizzle-orm'

import type {
  InsertWebsite,
  UpdateWebsite,
} from '#root/database/database_schema_types.js'
import { websitePages, websites } from '#root/database/schema.js'
import { hasMany } from '#root/database/utils/relationships.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'
import { Encryption } from '#root/core/shared/utils/encryption/encryption.js'

export class WebsiteRepository extends BaseRepository {
  constructor(protected database = makeDatabase()) {
    super()
  }

  protected hasManyPages() {
    return hasMany(this.database, {
      relationName: 'pages',
      from: websites,
      to: websitePages,
      primaryKey: websites.id,
      foreignKey: websitePages.websiteId,
    })
  }

  async create(payload: InsertWebsite) {
    const id = this.cuid()
    const homePageId = this.cuid()

    await this.database.insert(websites).values({ ...payload, id })
    await this.database.insert(websitePages).values({
      path: '/',
      id: homePageId,
      websiteId: id,
      publishedAt: new Date(),
      websiteContent: { type: 'doc', content: [] }, // TODO: Replace with correct website content once we have a website builder.
      draftWebsiteContent: { type: 'doc', content: [] }, // TODO: Replace with correct website content once we have a website builder.
    })

    return { id, homePageId }
  }

  async findById(websiteId: string) {
    const [website] = await this.database
      .select()
      .from(websites)
      .where(eq(websites.id, websiteId))
      .limit(1)

    return website
  }

  async findBySlugAndToken(slug: string, acmeChallengeToken: string) {
    const [website] = await this.database
      .select({
        websiteSslCertChallengeKeyAuthorization:
          websites.websiteSslCertChallengeKeyAuthorization,
      })
      .from(websites)
      .where(
        and(
          eq(websites.slug, slug),
          eq(websites.websiteSslCertChallengeToken, acmeChallengeToken),
        ),
      )
      .limit(1)

    if (website?.websiteSslCertChallengeKeyAuthorization) {
      website.websiteSslCertChallengeKeyAuthorization = new Encryption(appEnv.APP_KEY)
        .decrypt(website.websiteSslCertChallengeKeyAuthorization as string)
        ?.release() as string
    }

    return website
  }

  async findBySlugWithPages(slug: string) {
    const [website] = await this.hasManyPages()((query) =>
      query.where(eq(websites.slug, slug)),
    )

    return website
  }

  async findBySlug(slug: string) {
    const [website] = await this.database
      .select()
      .from(websites)
      .where(eq(websites.slug, slug))

    return website
  }

  async findByIdWithPages(websiteId: string) {
    const [website] = await this.hasManyPages()((query) =>
      query.where(eq(websites.id, websiteId)),
    )

    return website
  }

  async findByTeamId(teamId: string) {
    const [website] = await this.database
      .select()
      .from(websites)
      .where(eq(websites.teamId, teamId))
      .limit(1)

    return website
  }

  async updateById(websiteId: string, payload: UpdateWebsite) {
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

    await this.database.update(websites).set(payload).where(eq(websites.id, websiteId))

    return { id: websiteId }
  }
}
