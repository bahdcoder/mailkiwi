import { WEBSITES_DOMAIN, appEnv } from "@/app/env/app_env.js"
import { generateAcmeAccountIdentityCommand } from "@/cli/commands/generate_acme_account_identity.js"
import { IssueSSLCertificateForWebsiteJob } from "@/websites/jobs/issue_ssl_certificate_for_website_job.js"
import { WebsiteRepository } from "@/websites/repositories/website_repository.js"
import { faker } from "@faker-js/faker"
import { DateTime } from "luxon"
import { describe, test } from "vitest"

import { createUser } from "@/tests/mocks/auth/users.js"

import { settings } from "@/database/schema.js"

import {
  makeApp,
  makeDatabase,
  makeRedis,
} from "@/shared/container/index.js"
import { Encryption } from "@/shared/utils/encryption/encryption.js"

import { container } from "@/utils/typi.js"

describe("@website-ssl", () => {
  test.todo(
    "issues website ssl certs, encrypts and stores the certs to the database",
    async ({ expect }) => {
      await makeDatabase().delete(settings)

      await generateAcmeAccountIdentityCommand.handler?.()

      const { website } = await createUser({
        createAudienceForNewsletter: true,
      })

      const customerSlug = "fastmedia" + "-" + faker.lorem.slug()
      const customerDomain =
        "news" + "-" + faker.lorem.slug() + ".fastmedia.com"

      await container.make(WebsiteRepository).updateById(website.id, {
        slug: customerSlug,
        websiteDomain: customerDomain,
        websiteDomainVerifiedAt: DateTime.now().toJSDate(),
        websiteDomainCnameValue: `${customerSlug}.${WEBSITES_DOMAIN}`,
      })

      const jobResponse = await container
        .make(IssueSSLCertificateForWebsiteJob)
        .handle({
          payload: {
            websiteId: website.id,
          },
          database: makeDatabase(),
          redis: makeRedis(),
        })

      expect(jobResponse.success).toBe(true)

      const updatedWebsite = await container
        .make(WebsiteRepository)
        .findById(website.id)

      expect(updatedWebsite?.websiteSslCertKey).toBeDefined()
      expect(updatedWebsite?.websiteSslCertSecret).toBeDefined()

      const certificatePublicKey = new Encryption(appEnv.APP_KEY)
        .decrypt(updatedWebsite?.websiteSslCertKey as string)
        ?.release()

      const certificateKeyAuthorization = new Encryption(appEnv.APP_KEY)
        .decrypt(
          updatedWebsite.websiteSslCertChallengeKeyAuthorization as string,
        )
        ?.release()

      const certificatePrivateKey = new Encryption(appEnv.APP_KEY)
        .decrypt(updatedWebsite?.websiteSslCertSecret as string)
        ?.release()

      expect(certificatePublicKey).toContain(
        "-----BEGIN CERTIFICATE-----\n",
      )
      expect(certificatePublicKey).toContain("-----END CERTIFICATE-----\n")
      expect(certificatePrivateKey).toContain(
        "-----BEGIN RSA PRIVATE KEY-----\r\n",
      )
      expect(certificatePrivateKey).toContain(
        "-----END RSA PRIVATE KEY-----\r\n",
      )
      expect(updatedWebsite.websiteDomainSslVerifiedAt).toBeDefined()

      const app = makeApp()

      const response = await app.request(
        `/__websites/${updatedWebsite.slug}/.well-known/acme-challenge/${updatedWebsite.websiteSslCertChallengeToken}`,
      )

      expect(response.status).toBe(200)

      expect(await response.text()).toEqual(certificateKeyAuthorization)
    },
  )
})
