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
import { setupImport } from '#root/core/tests/integration/helpers/contacts/setup_imports.js'

describe('@contacts', () => {
  test('can create a contact for an audience', async ({ expect }) => {
    const { user, audience } = await createUser({
      createKnownProperties: false,
    })

    await makeDatabase()
      .update(audiences)
      .set({
        knownProperties: [
          {
            id: 'totalPurchasesMade',
            label: 'Total purchases made',
            type: 'float',
          },
          {
            id: 'lastLoginAt',
            label: 'Last logged in at',
            type: 'date',
          },
        ],
      })
      .where(eq(audiences.id, audience.id))

    const contactPayload = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.exampleEmail(),
      audienceId: audience.id,
      properties: {
        totalPurchasesMade: 53,
        lastLoginAt: new Date().toISOString(),
      },
    }

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/audiences/${audience.id}/contacts`,
      body: contactPayload,
    })

    expect(response.status).toEqual(200)

    const { id } = await response.json()

    const savedContact = await container.make(ContactRepository).findById(id)

    expect(savedContact).toBeDefined()
    expect(savedContact.properties).toHaveLength(2)

    const updatedAudience = await container.make(AudienceRepository).findById(audience.id)

    const lastLoginAtProperty = savedContact.properties.find(
      (property) => property.name === 'lastLoginAt',
    )

    const totalPurchasesMadeProperty = savedContact.properties.find(
      (property) => property.name === 'totalPurchasesMade',
    )

    expect(lastLoginAtProperty?.date?.toISOString()).toBeDefined()
    expect(totalPurchasesMadeProperty?.float).toEqual(53)
  })

  test('cannot create a contact with invalid data', async ({ expect }) => {
    const { user, audience } = await createUser()

    const contactPayload = {
      audienceId: audience.id,
    }

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/audiences/${audience.id}/contacts`,
      body: contactPayload,
    })

    const json = await response.json()

    expect(response.status).toEqual(422)
    expect(json.payload.errors[0].field).toEqual('email')
  })
})

describe('@contact-details', () => {
  test('can fetch the details of a contact (including activity)', async ({ expect }) => {
    const { user, audience } = await createUser()
    const { sendingDomain } = await setupDomainForDnsChecks()

    const contactPayload = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.exampleEmail(),
      audienceId: audience.id,
      properties: {
        totalPurchasesMade: 53,
        lastLoginAt: new Date().toISOString(),
      },
    }

    const createContactResponse = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/audiences/${audience.id}/contacts`,
      body: contactPayload,
    })

    expect(createContactResponse.status).toEqual(200)
    const { id } = await createContactResponse.json()

    const database = makeDatabase()

    const emailSendId = cuid()

    await database.insert(emailSends).values({
      recipient: contactPayload.email,
      sendingDomainId: sendingDomain.id,
      product: 'engage',
      id: emailSendId,
    })

    for (const eventType of ['Open', 'Click', 'Click', 'Click'] as const) {
      await database.insert(emailSendEvents).values({
        emailSendId,
        type: eventType,
        contactId: id,
        product: 'engage',
      })
    }

    const getContactResponse = await makeRequestAsUser(user, {
      method: 'GET',
      path: `/audiences/${audience.id}/contacts/${id}`,
      body: contactPayload,
    })

    const getContactResponseJson = await getContactResponse.json()

    expect(getContactResponseJson).toMatchObject({
      id,
      email: contactPayload.email,
      firstName: contactPayload.firstName,
      lastName: contactPayload.lastName,
    })

    const getContactActivityResponse = await makeRequestAsUser(user, {
      method: 'GET',
      path: `/audiences/${audience.id}/contacts/${id}/activity`,
      body: contactPayload,
    })

    const getContactActivityResponseJson = await getContactActivityResponse.json()

    expect(getContactActivityResponseJson.total).toBe(4)
    expect(getContactActivityResponseJson.data?.[0]).toMatchObject({
      emailSendId,
      type: 'Open',
    })
  })
})

describe('@contacts update', () => {
  test('can update the first name, last name, avatar and properties of a contact', async ({
    expect,
  }) => {
    const { user, audience } = await createUser()
    const database = makeDatabase()

    // Create a contact
    const createContactResponse = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/audiences/${audience.id}/contacts`,
      body: { email: faker.internet.email() },
    })

    const { id: contactId } = await createContactResponse.json()

    const updateData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      avatarUrl: faker.image.url(),
      properties: { profession: 'frontend engineer' },
    }

    const updateResponse = await makeRequestAsUser(user, {
      method: 'PATCH',
      path: `/audiences/${audience.id}/contacts/${contactId}`,
      body: updateData,
    })

    expect(updateResponse.status).toBe(200)
    const { id: updatedContactId } = await updateResponse.json()

    const updatedContact = await container
      .make(ContactRepository)
      .findById(updatedContactId)

    expect(updatedContact.firstName).toEqual(updateData.firstName)
    expect(updatedContact.lastName).toEqual(updateData.lastName)
    expect(updatedContact.avatarUrl).toEqual(updateData.avatarUrl)

    expect(updatedContact?.properties?.[0]?.text).toEqual('frontend engineer')
  })

  test('can override properties', async ({ expect }) => {
    const { user, audience } = await createUser({
      createKnownProperties: false,
    })
    const database = makeDatabase()

    await database
      .update(audiences)
      .set({
        knownProperties: [
          { id: 'age', label: 'Age', type: 'float' },
          {
            id: 'hobby',
            label: 'Your hobbies',
            type: 'text',
          },
          {
            id: 'favoriteColor',
            label: 'Favourite color',
            type: 'text',
          },
        ],
      })
      .where(eq(audiences.id, audience.id))

    // Create a contact with initial properties
    const createContactResponse = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/audiences/${audience.id}/contacts`,
      body: {
        email: faker.internet.email(),
        properties: { hobby: 'swimming', age: 25 },
      },
    })
    const { id: contactId } = await createContactResponse.json()

    const updateData = {
      properties: {
        hobby: 'reading',
        favoriteColor: 'blue',
      },
    }

    const updateResponse = await makeRequestAsUser(user, {
      method: 'PATCH',
      path: `/audiences/${audience.id}/contacts/${contactId}`,
      body: updateData,
    })

    expect(updateResponse.status).toBe(200)

    const { id: updatedContactId } = await updateResponse.json()

    const updatedContact = await container
      .make(ContactRepository)
      .findById(updatedContactId)

    const favouriteColor = updatedContact.properties.find(
      (property) => property.name === 'favoriteColor',
    )

    const ageProperty = updatedContact.properties.find(
      (property) => property.name === 'age',
    )

    const hobbyProperty = updatedContact.properties.find(
      (property) => property.name === 'hobby',
    )

    expect(favouriteColor?.text).toEqual('blue')
    expect(ageProperty?.float).toEqual(25)
    expect(hobbyProperty?.text).toEqual('reading')
  })

  test('can merge attributes without deleting existing properties', async ({
    expect,
  }) => {
    const { user, audience } = await createUser()
    const database = makeDatabase()

    await database
      .update(audiences)
      .set({
        knownProperties: [
          { id: 'age', label: 'Age', type: 'float' },
          {
            id: 'hobby',
            label: 'Your hobbies',
            type: 'text',
          },
          {
            id: 'favoriteColor',
            label: 'Favourite color',
            type: 'text',
          },
        ],
      })
      .where(eq(audiences.id, audience.id))

    // Create a contact with initial attributes
    const createContactResponse = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/audiences/${audience.id}/contacts`,
      body: {
        email: faker.internet.email(),
        properties: { hobby: 'swimming', age: 25 },
      },
    })

    const { id: contactId } = await createContactResponse.json()

    const updateData = {
      properties: { favoriteColor: 'blue' },
    }

    const updateResponse = await makeRequestAsUser(user, {
      method: 'PATCH',
      path: `/audiences/${audience.id}/contacts/${contactId}`,
      body: updateData,
    })

    expect(updateResponse.status).toBe(200)
    const { id: updatedContactId } = await updateResponse.json()

    const updatedContact = await container
      .make(ContactRepository)
      .findById(updatedContactId)

    const hobbyProperty = updatedContact.properties.find(
      (property) => property.name === 'hobby',
    )
    const ageProperty = updatedContact.properties.find(
      (property) => property.name === 'age',
    )
    const favouriteColorProperty = updatedContact.properties.find(
      (property) => property.name === 'favoriteColor',
    )

    expect(hobbyProperty?.text).toEqual('swimming')
    expect(ageProperty?.float).toEqual(25)
    expect(favouriteColorProperty?.text).toEqual('blue')
  })

  test('cannot update without proper authorisation', async ({ expect }) => {
    const { user, audience, team } = await createUser()
    const { user: unauthorizedUser } = await createUser()
    const database = makeDatabase()

    // Create a contact
    const createContactResponse = await makeRequestAsUser(
      user,
      {
        method: 'POST',
        path: `/audiences/${audience.id}/contacts`,
        body: { email: faker.internet.email() },
      },
      team.id,
    )
    const { id: contactId } = await createContactResponse.json()

    const updateData = {
      firstName: faker.person.firstName(),
    }

    const updateResponse = await makeRequestAsUser(unauthorizedUser, {
      method: 'PATCH',
      path: `/audiences/${audience.id}/contacts/${contactId}`,
      body: updateData,
    })

    expect(updateResponse.status).toBe(401)
  })
})

describe('@contacts imports', () => {
  test('can import contacts into an audience as a csv file', async ({ expect }) => {
    const { response, imports } = await setupImport('contacts.csv')

    expect(response.status).toBe(200)

    expect(imports).toHaveLength(1)
    expect(imports[0].status).toBe('PENDING')
    expect(imports[0].propertiesMap).toMatchObject({
      email: 'Email',
      lastName: 'Last Name',
      firstName: 'First Name',
      customPropertiesHeaders: [
        'Index',
        'Customer Id',
        'Company',
        'City',
        'Country',
        'Phone 1',
        'Phone 2',
        'Subscription Date',
        'Website',
      ],
    })
  })

  test('can begin processing by updating processing settings and status', async ({
    expect,
  }) => {
    const { imports, user, audience } = await setupImport('contacts.csv')

    const importId = imports?.[0]?.id

    const response = await makeRequestAsUser(user, {
      method: 'PUT',
      path: `/audiences/${audience.id}/imports/${importId}`,
      body: {
        subscribeAllContacts: false,
        tags: [],
        tagIds: [],
        propertiesMap: {
          firstName: 'First Name',
          lastName: 'Last Name',
          email: 'Email',
          customProperties: {
            Index: {
              id: 'Index',
              label: 'Index',
              type: 'float',
            },
            'Customer Id': {
              id: 'Customer Id',
              label: 'Customer Id',
              type: 'text',
            },
            Company: {
              id: 'Company',
              label: 'Company',
              type: 'text',
            },
            City: {
              id: 'City',
              label: 'City',
              type: 'text',
            },
            Country: {
              id: 'Country',
              label: 'Country',
              type: 'text',
            },
            'Phone 1': {
              id: 'Phone 1',
              label: 'Phone 1',
              type: 'text',
            },
            'Phone 2': {
              id: 'Phone 2',
              label: 'Phone 2',
              type: 'text',
            },
            'Subscription Date': {
              id: 'Subscription Date',
              label: 'Subscription Date',
              type: 'date',
            },
            Website: {
              id: 'Website',
              label: 'Website',
              type: 'text',
            },
          },
        },
      },
    })

    expect(response.status).toBe(200)

    const contactImport = await container.make(ContactImportRepository).findById(importId)

    expect(contactImport?.status).toBe('PROCESSING')

    const jobs = await Queue.contacts().getJobs()

    expect(jobs[0].data).toEqual({ contactImportId: contactImport?.id })
  })
})

describe('@contacts exports', () => {
  test('can export all contacts matching provided filterGroups', async ({ expect }) => {
    const { user, audience } = await createUser()

    const filterGroups = {
      type: 'OR',
      groups: [
        {
          type: 'AND',
          conditions: [
            {
              field: 'email',
              operation: 'startsWith',
              value: 'xx',
            },
          ],
        },
        {
          type: 'AND',
          conditions: [
            {
              field: 'firstName',
              operation: 'contains',
              value: 'xxx',
            },
          ],
        },
      ],
    }

    await makeRequestAsUser(user, {
      method: 'POST',
      path: `/audiences/${audience.id}/exports`,
      body: {
        filterGroups,
      },
    })

    const jobs = await Queue.contacts().getJobs()

    expect(jobs[0].data.filterGroups).toMatchObject(filterGroups)
  })
})
