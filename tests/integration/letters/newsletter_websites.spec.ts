import { CheckNewsletterDomainDnsConfiguration } from "@/letters/jobs/check_newsletter_domain_dns_configuration_job.js"
import { NewsletterWebsiteRepository } from "@/letters/repositories/newsletter_website_repository.js"
import { faker } from "@faker-js/faker"
import { describe, test } from "vitest"

import { createUser } from "@/tests/mocks/auth/users.js"
import { makeRequestAsUser } from "@/tests/utils/http.js"

import { makeApp } from "@/shared/container/index.js"
import { Queue } from "@/shared/queue/queue.js"

import { container } from "@/utils/typi.js"

describe("@newsletter-websites", () => {
  test("can add a custom domain to a newsletter website", async ({
    expect,
  }) => {
    const { newsletterWebsite, user, audienceForNewsletter, team } =
      await createUser({
        createAudienceForNewsletter: true,
      })

    const response = await makeRequestAsUser(
      user,
      {
        method: "PUT",
        body: {
          domain: `${faker.lorem.slug() + "-" + faker.number.int({ min: 10, max: 100 })}.fastmedia.com`,
        },
        path: `/audiences/${audienceForNewsletter?.id}/newsletter_websites/${newsletterWebsite.id}/custom-domain`,
      },
      team.id,
    )

    expect(response.status).toEqual(200)

    const queueJobs = await Queue.newsletter_websites().getJobs()

    const jobForNewsletterWebsite = queueJobs.find(
      (job) => job.data.newsletterWebsiteId === newsletterWebsite.id,
    )

    expect(jobForNewsletterWebsite).toBeDefined()
    expect(jobForNewsletterWebsite?.name).toEqual(
      CheckNewsletterDomainDnsConfiguration.id,
    )
  })

  test("cannot add an existing domain as custom domain to a newsletter website", async ({
    expect,
  }) => {
    const { newsletterWebsite, user, team, audienceForNewsletter } =
      await createUser({
        createAudienceForNewsletter: true,
      })

    const customDomain = `${faker.lorem.slug() + "-" + faker.number.int({ min: 10, max: 100 })}.fastmedia.com`

    await container
      .make(NewsletterWebsiteRepository)
      .updateById(newsletterWebsite.id, { websiteDomain: customDomain })

    const response = await makeRequestAsUser(
      user,
      {
        method: "PUT",
        body: {
          domain: customDomain,
        },
        path: `/audiences/${audienceForNewsletter?.id}/newsletter_websites/${newsletterWebsite.id}/custom-domain`,
      },
      team.id,
    )

    const json = await response.json()

    expect(response.status).toEqual(422)
    expect(json).toMatchObject({
      message: "Validation failed.",
      errors: [
        {
          message:
            "A website with this domain already exists. Please choose another domain for your newsletter website.",
          field: "domain",
        },
      ],
    })
  })

  test("can update website page content", async ({ expect }) => {
    const { newsletterWebsite, user, team, audienceForNewsletter } =
      await createUser({
        createAudienceForNewsletter: true,
      })

    const websiteContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world" }],
        },
      ],
    }

    const response = await makeRequestAsUser(
      user,
      {
        method: "PUT",
        body: {
          websiteContent,
        },
        path: `/audiences/${audienceForNewsletter?.id}/newsletter_websites/${newsletterWebsite.id}/website_pages/${newsletterWebsite?.pages?.[0]?.id}`,
      },
      team.id,
    )

    expect(response.status).toEqual(200)

    const updatedNewletterWebsite = await container
      .make(NewsletterWebsiteRepository)
      .findByIdWithPages(newsletterWebsite.id)

    expect(
      updatedNewletterWebsite.pages?.[0]?.websiteContent,
    ).toMatchObject(websiteContent)
  })
})

describe("@newsletter-websites-pages", () => {
  test("can visit a newsletter website using website subdomain", async () => {
    // make get request to app using a host such as fastmedia.kibaletters.com

    const app = makeApp()

    await app.request("/letters/:newsletterWebsiteSlug")

    // reverse proxy will programmatically route traffic from fastmedia.kibaletters.com/* -> http://hono_server/letters/fastmedia/*

    // expect home page returned belongs to fastmedia, with valid parsed HTML
    // and including css files
    // we expect these pages to be cached at cdn level, and cache invalidated programmatically
  })
})
