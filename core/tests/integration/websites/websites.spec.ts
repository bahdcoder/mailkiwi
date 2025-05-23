import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { HTMLJsonBlock } from '#root/core/websites/dto/update_website_page_dto.js'
import { CheckWebsiteDomainDnsConfiguration } from '#root/core/websites/jobs/check_website_domain_dns_configuration_job.js'
import { WebsitePageRepository } from '#root/core/websites/repositories/website_page_repository.js'
import { WebsiteRepository } from '#root/core/websites/repositories/website_repository.js'
import { faker } from '@faker-js/faker'
import { load as cheerioLoad } from 'cheerio'
import { describe, test } from 'vitest'

import { createUser } from '#root/core/tests/mocks/auth/users.js'
import { makeRequestAsUser } from '#root/core/tests/utils/http.js'

import { ContainerKey, makeApp } from '#root/core/shared/container/index.js'
import { Queue } from '#root/core/shared/queue/queue.js'

import { container } from '#root/core/utils/typi.js'

describe('@websites', () => {
  test('can add a custom domain to a newsletter website', async ({ expect }) => {
    const { website, user, team } = await createUser({
      createAudienceForNewsletter: true,
    })

    const response = await makeRequestAsUser(
      user,
      {
        method: 'PUT',
        body: {
          domain: `${`${faker.lorem.slug()}-${faker.number.int({
            min: 10,
            max: 100,
          })}`}.fastmedia.com`,
        },
        path: `/websites/${website.id}/custom_domains`,
      },
      team.id,
    )

    expect(response.status).toEqual(200)

    const queueJobs = await Queue.websites().getJobs()

    const jobForWebsite = queueJobs.find((job) => job.data.websiteId === website.id)

    expect(jobForWebsite).toBeDefined()
    expect(jobForWebsite?.name).toEqual(CheckWebsiteDomainDnsConfiguration.id)
  })

  test('cannot add an existing domain as custom domain to a newsletter website', async ({
    expect,
  }) => {
    const { website, user, team } = await createUser({
      createAudienceForNewsletter: true,
    })

    const customDomain = `${`${faker.lorem.slug()}-${faker.number.int({
      min: 10,
      max: 100,
    })}`}.fastmedia.com`

    await container
      .make(WebsiteRepository)
      .updateById(website.id, { websiteDomain: customDomain })

    const response = await makeRequestAsUser(
      user,
      {
        method: 'PUT',
        body: {
          domain: customDomain,
        },
        path: `/websites/${website.id}/custom_domains`,
      },
      team.id,
    )

    const json = await response.json()

    expect(response.status).toEqual(422)
    expect(json.payload).toMatchObject({
      message: 'Validation failed.',
      errors: [
        {
          message:
            'This domain is already in use by another newsletter website. Please choose a different domain or subdomain for your newsletter.',
          field: 'domain',
        },
      ],
    })
  })

  test('can update website page content', async ({ expect }) => {
    const { website, user, team } = await createUser()

    const draftWebsiteContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello world' }],
        },
      ],
    }

    const response = await makeRequestAsUser(
      user,
      {
        method: 'PUT',
        body: {
          draftWebsiteContent,
        },
        path: `/websites/${website.id}/website_pages/${website?.pages?.[0]?.id}`,
      },
      team.id,
    )

    expect(response.status).toEqual(200)

    const updatedNewletterWebsite = await container
      .make(WebsiteRepository)
      .findByIdWithPages(website.id)

    expect(updatedNewletterWebsite.pages?.[0]?.draftWebsiteContent).toMatchObject(
      draftWebsiteContent,
    )
  })

  test('can create additional website pages', async ({ expect }) => {
    const { website, user, team } = await createUser({
      createAudienceForNewsletter: true,
    })

    const draftWebsiteContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello world' }],
        },
      ],
    }

    const payload = {
      draftWebsiteContent,
      path: faker.lorem.slug(),
      title: faker.lorem.words(5),
      description: faker.lorem.sentences(2),
    }

    const response = await makeRequestAsUser(
      user,
      {
        method: 'POST',
        body: payload,
        path: `/websites/${website.id}/website_pages/`,
      },
      team.id,
    )

    expect(response.status).toEqual(200)

    const updatedNewletterWebsite = await container
      .make(WebsiteRepository)
      .findByIdWithPages(website.id)

    const secondPage = updatedNewletterWebsite.pages?.[1]

    expect(updatedNewletterWebsite.pages).toHaveLength(2)
    expect({
      path: secondPage.path,
      title: secondPage.title,
      description: secondPage.description,
      draftWebsiteContent: secondPage.draftWebsiteContent,
    }).toMatchObject({ ...payload })
  })

  test('can publish website pages', async ({ expect }) => {
    const { website, user, team } = await createUser()

    const draftWebsiteContent = {
      type: 'doc' as const,
      attrs: {},
      content: [
        {
          type: 'paragraph' as const,
          content: [{ type: 'text', text: 'Hello world', attrs: {}, content: [] }],
          attrs: {},
        },
      ] as HTMLJsonBlock[],
    }

    const payload = {
      draftWebsiteContent,
      path: faker.lorem.slug(),
      title: faker.lorem.words(5),
      description: faker.lorem.sentences(2),
    }

    const { id: websitePageId } = await container
      .make(WebsitePageRepository)
      .create(payload, website.id)

    const response = await makeRequestAsUser(
      user,
      {
        method: 'PUT',
        body: payload,
        path: `/websites/${website.id}/website_pages/${websitePageId}/publish`,
      },
      team.id,
    )

    expect(response.status).toEqual(200)

    const updatedNewletterWebsite = await container
      .make(WebsiteRepository)
      .findByIdWithPages(website.id)

    const secondPage = updatedNewletterWebsite.pages?.[1]

    expect(secondPage.websiteContent).toMatchObject(
      secondPage.draftWebsiteContent as HTMLJsonBlock,
    )

    expect(
      updatedNewletterWebsite.pages.filter((page) => page.publishedAt !== null),
    ).toHaveLength(2)
  })

  test('can unpublish website pages', async ({ expect }) => {
    const { website, user, team } = await createUser()

    const draftWebsiteContent = {
      type: 'doc' as const,
      attrs: {},
      content: [
        {
          type: 'paragraph' as const,
          content: [{ type: 'text', text: 'Hello world', attrs: {}, content: [] }],
          attrs: {},
        },
      ] as HTMLJsonBlock[],
    }

    const payload = {
      draftWebsiteContent,
      path: faker.lorem.slug(),
      title: faker.lorem.words(5),
      description: faker.lorem.sentences(2),
    }

    const websitePageRepository = container.make(WebsitePageRepository)

    const { id: websitePageId } = await websitePageRepository.create(payload, website.id)

    await websitePageRepository.publish(
      await websitePageRepository.findById(websitePageId),
    )

    const response = await makeRequestAsUser(
      user,
      {
        method: 'PUT',
        body: payload,
        path: `/websites/${website.id}/website_pages/${websitePageId}/unpublish`,
      },
      team.id,
    )

    expect(response.status).toEqual(200)

    const updatedNewletterWebsite = await container
      .make(WebsiteRepository)
      .findByIdWithPages(website.id)

    const secondPage = updatedNewletterWebsite.pages?.[1]

    expect(secondPage.publishedAt).toBeNull()

    expect(
      updatedNewletterWebsite.pages.filter((page) => page.publishedAt !== null),
    ).toHaveLength(1)
  })
})

describe('@websites-pages', () => {
  test('can visit a newsletter website home page using website slug', async ({
    expect,
  }) => {
    const websiteContent = JSON.parse(
      await readFile(
        resolve('core/tests/integration/websites/website_content_doc.json'),
        'utf-8',
      ),
    )

    const { website } = await createUser({
      createAudienceForNewsletter: true,
    })

    const aboutPagePath = 'about-me-page'

    const websitePageRepository = await container.make(WebsitePageRepository)

    const { id: websitePageId } = await websitePageRepository.create(
      {
        path: aboutPagePath,
        title: faker.lorem.words(5),
        draftWebsiteContent: websiteContent,
      },
      website.id,
    )

    await websitePageRepository.publish(
      await websitePageRepository.findById(websitePageId),
    )

    const homePage = website?.pages?.[0]

    await container
      .make(WebsitePageRepository)
      .updateById(homePage.id, { websiteContent, publishedAt: new Date() })

    const app = makeApp()

    const response = await app.request(`/__websites/${website.slug}/`)

    const html = await response.text()

    const $ = cheerioLoad(html)

    expect($('.kb-container').html()).not.toBeNull()
    expect($('.kb-columns').html()).not.toBeNull()
    expect($('.kb-column').html()).not.toBeNull()
    expect($('.kb-heading').html()).not.toBeNull()
    expect($('.kb-heading-level-1').html()).not.toBeNull()
    expect($('span.kb-text-slice').html()).not.toBeNull()

    const link = $('link[rel="stylesheet"]').first()

    link.attr('href')
    expect(link.attr('href')).toEqual(
      `/assets/letters/kb-letters.css?v=${container.make(ContainerKey.version)}`,
    )

    const aboutMePageResponse = await app.request(
      `/__websites/${website.slug}/${aboutPagePath}`,
    )

    expect(aboutMePageResponse.status).toBe(200)

    const aboutMePageHtml = await aboutMePageResponse.text()

    expect(cheerioLoad(aboutMePageHtml)('.kb-container').html()).not.toBeNull()
  })
})
