import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Readable } from 'node:stream'
import { appEnv } from '#root/core/app/env/app_env.js'
import { S3Disk } from '#root/core/minio/s3_client.js'
import { S3Client } from '@aws-sdk/client-s3'
import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { describe, test, vi } from 'vitest'

import { CreateTagAction } from '#root/core/audiences/actions/tags/create_tag_action.js'
import { AudienceRepository } from '#root/core/audiences/repositories/audience_repository.js'
import { ContactImportRepository } from '#root/core/audiences/repositories/contact_import_repository.js'
import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'

import { createUser } from '#root/core/tests/mocks/auth/users.js'
import {
  getCookieSessionForUser,
  makeRequest,
  makeRequestAsUser,
} from '#root/core/tests/utils/http.js'

import type { ContactImport } from '#root/database/database_schema_types.js'
import {
  audiences,
  contactImports,
  emailSendEvents,
  emailSends,
} from '#root/database/schema.js'

import { makeApp, makeDatabase } from '#root/core/shared/container/index.js'
import { Queue } from '#root/core/shared/queue/queue.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'

import { container } from '#root/core/utils/typi.js'
import { setupDomainForDnsChecks } from '#root/core/tests/unit/helpers/domains/setup_domain_for_dns_checks.js'

export const setupImport = async (fileName: string, updateSettings = false) => {
  const form = new FormData()

  const contactsCsv = await readFile(
    resolve(
      process.cwd(),
      'core',
      'tests',
      'integration',
      'audiences',
      'mocks',
      fileName,
    ),
    'utf-8',
  )

  const FakeS3Client = {
    putObject: vi.fn(async () => ({})),
    getObjectStream: vi.fn(async () => Readable.from(contactsCsv)),
  }

  container.fake(S3Disk, FakeS3Client as unknown as S3Disk)

  const contactsCsvBlob = new Blob([contactsCsv], {
    type: 'text/csv',
  })

  form.append('file', contactsCsvBlob)

  const { audience, user, team } = await createUser()

  const app = makeApp()

  const response = await app.request(`/audiences/${audience.id}/imports`, {
    method: 'POST',
    body: form,
    headers: {
      [appEnv.software.teamHeader]: team.id.toString(),
      Cookie: await getCookieSessionForUser(user),
    },
  })

  const database = makeDatabase()

  let contactImport: ContactImport | null = null
  const imports = await database
    .select()
    .from(contactImports)
    .where(eq(contactImports.audienceId, audience.id))

  if (updateSettings) {
    const importId = imports?.[0]?.id

    const mockTag = await container
      .make(CreateTagAction)
      .handle({ name: faker.lorem.word() }, audience.id)

    const updateSettingsResponse = await makeRequestAsUser(user, {
      method: 'PUT',
      path: `/audiences/${audience.id}/imports/${importId}`,
      body: {
        subscribeAllContacts: false,
        tagIds: [mockTag.id],
        tags: ['interested-in-book', 'ecommerce-prospects'],
        propertiesMap: {
          firstName: 'First Name',
          lastName: 'Last Name',
          email: 'Email',
          customProperties: {
            Company: {
              id: 'company',
              label: 'Company',
              type: 'text',
            },
            'Customer Id': {
              id: 'customerId',
              label: 'Customer Id',
              type: 'text',
            },
            Index: {
              id: 'index',
              label: 'Index',
              type: 'float',
            },
            City: {
              id: 'city',
              label: 'City',
              type: 'text',
            },
            'Phone 1': {
              id: 'phone1',
              label: 'Phone 1',
              type: 'text',
            },
            'Phone 2': {
              id: 'phone2',
              label: 'Phone 2',
              type: 'text',
            },
            'Subscription Date': {
              id: 'subscriptionDate',
              label: 'Subscription Date',
              type: 'date',
            },
            Website: {
              id: 'website',
              label: 'Website',
              type: 'text',
            },
          },
        },
      },
    })

    if (updateSettingsResponse.status !== 200) {
      throw new Error('Failed to update import settings')
    }

    const updatedContactImport = await container
      .make(ContactImportRepository)
      .findById(importId)

    if (updatedContactImport) {
      contactImport = updatedContactImport
    }
  }

  return { response, imports, user, audience, contactImport }
}
