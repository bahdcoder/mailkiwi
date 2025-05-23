import { faker } from '@faker-js/faker'
import { and, eq } from 'drizzle-orm'
import { describe, test } from 'vitest'

import { SenderIdentityRepository } from '#root/core/sending_domains/repositories/sender_identity_repository.js'

import {
  createUser,
  setupSendingDomainForTeam,
} from '#root/core/tests/mocks/auth/users.js'
import { makeRequestAsUser } from '#root/core/tests/utils/http.js'

import { senderIdentities } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'

import { container } from '#root/core/utils/typi.js'
import { OtpGenerator } from '#root/core/shared/tokens/otp_generator.js'

describe('@sender-identities', () => {
  test('can create a sender identity for a team', async ({ expect }) => {
    const { team, user } = await createUser()
    const sendingDomainId = await setupSendingDomainForTeam(team.id)

    const payload = {
      name: `${faker.person.firstName()}'s Newsletter`,
      email: faker.internet.userName().toLowerCase(),
      sendingDomainId,
      replyToEmail: faker.internet.email(),
    }

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/sender-identities',
      body: payload,
    })

    expect(response.status).toBe(200)

    const database = makeDatabase()
    const savedIdentity = await database.query.senderIdentities.findFirst({
      where: and(
        eq(senderIdentities.teamId, team.id),
        eq(senderIdentities.name, payload.name),
      ),
    })

    expect(savedIdentity).toBeDefined()
    expect(savedIdentity?.email).toBe(payload.email)
    expect(savedIdentity?.sendingDomainId).toBe(sendingDomainId)
    expect(savedIdentity?.replyToEmail).toBe(payload.replyToEmail)
  })

  test('cannot create a sender identity with an invalid sending domain', async ({
    expect,
  }) => {
    const { team, user } = await createUser()

    const payload = {
      name: `${faker.person.firstName()}'s Newsletter`,
      email: faker.internet.userName().toLowerCase(),
      sendingDomainId: 'invalid-domain-id',
      replyToEmail: faker.internet.email(),
    }

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/sender-identities',
      body: payload,
    })

    const json = await response.json()

    expect(json.payload.errors[0].message).toEqual(
      'The selected sending domain does not exist in your account. Please choose a valid sending domain.',
    )

    expect(response.status).toBe(422)
  })

  test('can list all sender identities for a team', async ({ expect }) => {
    const { team, user } = await createUser()
    const sendingDomainId = await setupSendingDomainForTeam(team.id)

    const identityCount = 3
    for (let i = 0; i < identityCount; i++) {
      await container.make(SenderIdentityRepository).create({
        name: `${faker.person.firstName()}'s Newsletter ${i}`,
        email: faker.internet.userName().toLowerCase(),
        sendingDomainId,
        teamId: team.id,
      })
    }

    const response = await makeRequestAsUser(user, {
      method: 'GET',
      path: '/sender-identities',
    })

    expect(response.status).toBe(200)

    const identities = await response.json()
    expect(identities).toHaveLength(identityCount)
    expect(identities[0]).toHaveProperty('id')
    expect(identities[0]).toHaveProperty('name')
    expect(identities[0]).toHaveProperty('email')
  })

  test('can get a specific sender identity', async ({ expect }) => {
    const { team, user } = await createUser()
    const sendingDomainId = await setupSendingDomainForTeam(team.id)

    const { id: senderIdentityId } = await container
      .make(SenderIdentityRepository)
      .create({
        name: `${faker.person.firstName()}'s Newsletter`,
        email: faker.internet.userName().toLowerCase(),
        sendingDomainId,
        teamId: team.id,
      })

    const response = await makeRequestAsUser(user, {
      method: 'GET',
      path: `/sender-identities/${senderIdentityId}`,
    })

    expect(response.status).toBe(200)

    const identity = await response.json()
    expect(identity.payload.id).toBe(senderIdentityId)
    expect(identity.payload.teamId).toBe(team.id)
  })

  test('cannot get a sender identity from another team', async ({ expect }) => {
    const { team: team1, user: user1 } = await createUser()
    const { team: team2, user: user2 } = await createUser()
    const sendingDomainId = await setupSendingDomainForTeam(team1.id)

    const { id: senderIdentityId } = await container
      .make(SenderIdentityRepository)
      .create({
        name: `${faker.person.firstName()}'s Newsletter`,
        email: faker.internet.userName().toLowerCase(),
        sendingDomainId,
        teamId: team1.id,
      })

    const response = await makeRequestAsUser(user2, {
      method: 'GET',
      path: `/sender-identities/${senderIdentityId}`,
    })

    expect(response.status).toBe(401)
  })

  test('can update a sender identity', async ({ expect }) => {
    const { team, user } = await createUser()
    const sendingDomainId = await setupSendingDomainForTeam(team.id)

    const { id: senderIdentityId } = await container
      .make(SenderIdentityRepository)
      .create({
        name: `${faker.person.firstName()}'s Newsletter`,
        email: faker.internet.userName().toLowerCase(),
        sendingDomainId,
        teamId: team.id,
      })

    const updatePayload = {
      name: `Updated ${faker.person.firstName()}'s Newsletter`,
      email: faker.internet.userName().toLowerCase(),
    }

    const response = await makeRequestAsUser(user, {
      method: 'PATCH',
      path: `/sender-identities/${senderIdentityId}`,
      body: updatePayload,
    })

    expect(response.status).toBe(200)

    const database = makeDatabase()
    const updatedIdentity = await database.query.senderIdentities.findFirst({
      where: eq(senderIdentities.id, senderIdentityId),
    })

    expect(updatedIdentity?.name).toBe(updatePayload.name)
    expect(updatedIdentity?.email).toBe(updatePayload.email)
  })

  test('can delete a sender identity', async ({ expect }) => {
    const { team, user } = await createUser()
    const sendingDomainId = await setupSendingDomainForTeam(team.id)

    const { id: senderIdentityId } = await container
      .make(SenderIdentityRepository)
      .create({
        name: `${faker.person.firstName()}'s Newsletter`,
        email: faker.internet.userName().toLowerCase(),
        sendingDomainId,
        teamId: team.id,
      })

    const response = await makeRequestAsUser(user, {
      method: 'DELETE',
      path: `/sender-identities/${senderIdentityId}`,
    })

    expect(response.status).toBe(200)

    const database = makeDatabase()
    const deletedIdentity = await database.query.senderIdentities.findFirst({
      where: eq(senderIdentities.id, senderIdentityId),
    })

    expect(deletedIdentity).toBeUndefined()
  })
})

describe('@sender-identities-verification', () => {
  test('can generate a verification code for a sender identity email', async ({
    expect,
  }) => {
    const { team, user } = await createUser()
    const sendingDomainId = await setupSendingDomainForTeam(team.id)

    const { id: senderIdentityId } = await container
      .make(SenderIdentityRepository)
      .create({
        name: `${faker.person.firstName()}'s Newsletter`,
        email: faker.internet.userName().toLowerCase(),
        sendingDomainId,
        teamId: team.id,
      })

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/sender-identities/${senderIdentityId}/verify/generate`,
    })

    expect(response.status).toBe(200)

    const database = makeDatabase()
    const updatedIdentity = await database.query.senderIdentities.findFirst({
      where: eq(senderIdentities.id, senderIdentityId),
    })

    expect(updatedIdentity?.emailVerificationCode).toBeDefined()
    expect(updatedIdentity?.emailVerificationCodeExpiresAt).toBeDefined()
  })

  test('can verify a sender identity email with a valid code', async ({ expect }) => {
    const { team, user } = await createUser()
    const sendingDomainId = await setupSendingDomainForTeam(team.id)

    const { id: senderIdentityId } = await container
      .make(SenderIdentityRepository)
      .create({
        name: `${faker.person.firstName()}'s Newsletter`,
        email: faker.internet.userName().toLowerCase(),
        sendingDomainId,
        teamId: team.id,
      })

    const MOCK_VERIFICATION_CODE = 123456

    container.fake(OtpGenerator, {
      generate() {
        return MOCK_VERIFICATION_CODE
      },
    })

    const generateResponse = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/sender-identities/${senderIdentityId}/verify/generate`,
    })

    expect(generateResponse.status).toBe(200)

    const verifyResponse = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/sender-identities/${senderIdentityId}/verify`,
      body: { code: MOCK_VERIFICATION_CODE.toString() },
    })

    expect(verifyResponse.status).toBe(200)

    const result = await verifyResponse.json()

    expect(result.payload.verified).toBe(true)

    const database = makeDatabase()
    const verifiedIdentity = await database.query.senderIdentities.findFirst({
      where: eq(senderIdentities.id, senderIdentityId),
    })

    expect(verifiedIdentity?.emailVerifiedAt).toBeDefined()
    expect(verifiedIdentity?.emailVerificationCode).toBeNull()
    expect(verifiedIdentity?.emailVerificationCodeExpiresAt).toBeNull()

    container.restoreAll()
  })

  test('cannot verify a sender identity email with an invalid code', async ({
    expect,
  }) => {
    const { team, user } = await createUser()
    const sendingDomainId = await setupSendingDomainForTeam(team.id)

    const { id: senderIdentityId } = await container
      .make(SenderIdentityRepository)
      .create({
        name: `${faker.person.firstName()}'s Newsletter`,
        email: faker.internet.userName().toLowerCase(),
        sendingDomainId,
        teamId: team.id,
      })

    const verifyResponse = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/sender-identities/${senderIdentityId}/verify`,
      body: { code: '000000' },
    })

    expect(verifyResponse.status).toBe(422)

    const result = await verifyResponse.json()

    expect(result.payload.errors[0].message).toBe('Verification code was invalid.')

    const database = makeDatabase()
    const identity = await database.query.senderIdentities.findFirst({
      where: eq(senderIdentities.id, senderIdentityId),
    })

    expect(identity?.emailVerifiedAt).toBeNull()
    expect(identity?.emailVerificationCode).not.toBeNull()
  })
})
