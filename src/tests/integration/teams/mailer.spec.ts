import {
  BehaviorOnMXFailure,
  CreateConfigurationSetCommand,
  CreateConfigurationSetEventDestinationCommand,
  DeleteIdentityCommand,
  GetAccountSendingEnabledCommand,
  GetIdentityDkimAttributesCommand,
  GetIdentityMailFromDomainAttributesCommand,
  GetIdentityVerificationAttributesCommand,
  GetSendQuotaCommand,
  ListIdentitiesCommand,
  SESClient,
  SetIdentityMailFromDomainCommand,
} from '@aws-sdk/client-ses'
import {
  CreateEmailIdentityCommand,
  DeleteEmailIdentityCommand,
} from '@aws-sdk/client-sesv2'
import {
  ListSubscriptionsByTopicCommand,
  ListTopicsCommand,
  SNSClient,
  SubscribeCommand,
} from '@aws-sdk/client-sns'
import { faker } from '@faker-js/faker'
import { mockClient } from 'aws-sdk-client-mock'
import { and, eq } from 'drizzle-orm'
import { beforeEach, describe, test, vi } from 'vitest'

import { MailerIdentityRepository } from '@/domains/teams/repositories/mailer_identity_repository.js'
import { MailerRepository } from '@/domains/teams/repositories/mailer_repository.js'
import { makeConfig, makeDatabase } from '@/infrastructure/container.js'
import {
  mailerIdentities,
  mailers,
} from '@/infrastructure/database/schema/schema.js'
import { createUser } from '@/tests/mocks/auth/users.js'
import { refreshDatabase } from '@/tests/mocks/teams/teams.js'
import { makeRequestAsUser } from '@/tests/utils/http.js'
import * as sleepUtils from '@/utils/sleep.js'
import { container } from '@/utils/typi.js'

const SESMock = mockClient(SESClient)
const SNSMock = mockClient(SNSClient)

describe('Teams / Mailers', () => {
  beforeEach(() => {
    SNSMock.reset()
    SESMock.reset()
  })

  test('can create mailers', async ({ expect }) => {
    const { user } = await createUser()
    const database = makeDatabase()

    const mailerPayload = {
      name: faker.string.uuid(),
      provider: 'AWS_SES',
    }

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/mailers',
      body: mailerPayload,
    })

    expect(response.status).toBe(200)

    const mailer = await database.query.mailers.findFirst({
      where: eq(mailers.name, mailerPayload.name),
    })

    expect(mailer).toBeDefined()
    expect(mailer?.provider).toBe(mailerPayload.provider)
  })

  test('can update mailers while creating a domain sending identity', async ({
    expect,
  }) => {
    const { user, team } = await createUser()
    const database = makeDatabase()

    const mailerPayload = {
      name: faker.string.uuid(),
      provider: 'AWS_SES',
    }

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/mailers',
      body: mailerPayload,
    })

    const updateConfigPayload = {
      accessKey: faker.string.alphanumeric({ length: 16 }),
      accessSecret: faker.string.alphanumeric({ length: 16 }),
      region: 'us-east-1',
      domain: 'newsletter.example.com',
    }

    const updateResponse = await makeRequestAsUser(user, {
      method: 'PATCH',
      path: `/mailers/${(await response.json()).id}`,
      body: {
        configuration: updateConfigPayload,
      },
    })

    // mock aws clients to resolve api calls.
    SESMock.onAnyCommand().resolves({})
    SNSMock.onAnyCommand().resolves({})

    expect(updateResponse.status).toBe(200)

    const mailerRepository = container.resolve(MailerRepository)

    const mailer = await database.query.mailers.findFirst({
      where: eq(mailers.name, mailerPayload.name),
      with: {
        identities: true,
      },
    })

    expect(mailer).not.toBeNull()
    const domainIdentity = mailer?.identities.find(
      (identity) =>
        identity.type === 'DOMAIN' &&
        identity.value === updateConfigPayload.domain,
    )

    expect(domainIdentity).not.toBeNull()

    expect(
      (domainIdentity?.configuration as { publicKey: string }).publicKey.length,
    ).toBe(216)
    expect(domainIdentity?.status).toBe('PENDING')

    const updatedConfiguration = mailerRepository.getDecryptedConfiguration(
      mailer?.configuration ?? '',
      team?.configurationKey,
    )
    expect(updatedConfiguration.accessKey.release()).toEqual(
      updateConfigPayload.accessKey,
    )
    expect(updatedConfiguration.accessSecret.release()).toEqual(
      updateConfigPayload.accessSecret,
    )

    const mailerIdentityRepository = container.resolve(MailerIdentityRepository)

    const appShortName = makeConfig().software.shortName
    const { privateKey: decodedMailerIdentityPrivateKey } =
      await mailerIdentityRepository.decryptRsaPrivateKey(
        team?.configurationKey,
        (domainIdentity?.configuration as { privateKey: string }).privateKey,
      )

    // check ses calls

    const firstCallToCheckCredentialAccess = SESMock.calls()[0]

    expect(firstCallToCheckCredentialAccess.args[0]).toBeInstanceOf(
      GetSendQuotaCommand,
    )

    const secondCallToCheckCredentialAccess = SESMock.calls()[1]
    expect(secondCallToCheckCredentialAccess.args[0]).toBeInstanceOf(
      ListIdentitiesCommand,
    )

    const thirdCallToCreateDomainIdentity = SESMock.calls()[2]
    expect(thirdCallToCreateDomainIdentity.args[0]).toBeInstanceOf(
      CreateEmailIdentityCommand,
    )
    expect(thirdCallToCreateDomainIdentity.args[0].input).toEqual({
      EmailIdentity: updateConfigPayload.domain,
      ConfigurationSetName: `${appShortName}_${mailer?.id}`,
      DkimSigningAttributes: {
        DomainSigningPrivateKey: decodedMailerIdentityPrivateKey.release(),
        DomainSigningSelector: appShortName,
      },
    })

    const fourthCallToSetIdentityDomain = SESMock.calls()[3]

    expect(fourthCallToSetIdentityDomain.args[0]).toBeInstanceOf(
      SetIdentityMailFromDomainCommand,
    )
    expect(fourthCallToSetIdentityDomain.args[0].input).toEqual({
      Identity: updateConfigPayload.domain,
      MailFromDomain: `send.${updateConfigPayload.domain}`,
      BehaviorOnMXFailure: BehaviorOnMXFailure.UseDefaultValue,
    })

    // check sns calls
    const firstSnsCallToCheckCredentialAccess = SNSMock.calls()[0]
    expect(firstSnsCallToCheckCredentialAccess.args[0]).toBeInstanceOf(
      ListTopicsCommand,
    )
  })

  test('can install a mailer and reconnect it with new credentials if access is revoked', async ({
    expect,
  }) => {
    const { user, setting, team } = await createUser()

    const sleepMock = vi
      .spyOn(sleepUtils, 'sleep')
      .mockImplementation(() => Promise.resolve())

    const mailerPayload = {
      name: faker.string.uuid(),
      provider: 'AWS_SES',
    }

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/mailers',
      body: mailerPayload,
    })

    const updateConfigPayload = {
      accessKey: faker.string.alphanumeric({ length: 16 }),
      accessSecret: faker.string.alphanumeric({ length: 16 }),
      region: 'us-east-1',
      domain: 'newsletter.example.com',
    }

    const json = await response.json()

    const mailerId = json.id

    const updateResponse = await makeRequestAsUser(user, {
      method: 'PATCH',
      path: `/mailers/${json.id}`,
      body: {
        configuration: updateConfigPayload,
      },
    })

    expect(updateResponse.status).toBe(200)

    SNSMock.resetHistory()
    SESMock.resetHistory()

    const configurationName = `${makeConfig().software.shortName}_${mailerId}`

    const TopicArn = `arn:aws:sns:us-east-1:123456789012:${configurationName}`
    const SubscriptionArn = `arn:aws:sns:us-east-1:123456789012:${configurationName}`

    SNSMock.on(ListTopicsCommand).resolves({
      Topics: [
        {
          TopicArn,
        },
      ],
    })

    SNSMock.on(ListSubscriptionsByTopicCommand).resolves({
      Subscriptions: [
        {
          SubscriptionArn,
          Protocol: 'https',
          Endpoint: setting?.url ?? '',
        },
      ],
    })

    SNSMock.on(SubscribeCommand).resolves({
      SubscriptionArn,
    })

    const installResponse = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/mailers/${json.id}/install`,
    })

    expect(installResponse.status).toBe(200)

    const createConfigurationSet = SESMock.calls()[3]
    const setDestinationOfSnsNotifications = SESMock.calls()[5]

    expect(createConfigurationSet.args[0]).toBeInstanceOf(
      CreateConfigurationSetCommand,
    )
    expect(createConfigurationSet.args[0].input).toEqual({
      ConfigurationSet: { Name: configurationName },
    })

    expect(setDestinationOfSnsNotifications.args[0]).toBeInstanceOf(
      CreateConfigurationSetEventDestinationCommand,
    )
    expect(setDestinationOfSnsNotifications.args[0].input).toEqual({
      ConfigurationSetName: configurationName,
      EventDestination: {
        Enabled: true,
        Name: configurationName,
        MatchingEventTypes: ['reject', 'bounce', 'complaint', 'click', 'open'],
        SNSDestination: {
          TopicARN: TopicArn,
        },
      },
    })

    const subscribeCommand = SNSMock.calls()[3]

    expect(subscribeCommand.args[0]).toBeInstanceOf(SubscribeCommand)

    expect(subscribeCommand.args[0].input).toEqual({
      Protocol: 'https',
      TopicArn,
      Endpoint: `${setting?.url}/webhooks/ses`,
      Attributes: {
        DeliveryPolicy: `{"throttlePolicy":{"maxReceivesPerSecond":5}}`,
      },
    })

    // call profile to refresh identity statuses. but this time, simulate a situation where the api keys have expired

    SESMock.on(GetSendQuotaCommand).rejects({
      message: 'Access keys have expired. Requires rotation.',
    })

    const profileResponse = await makeRequestAsUser(user, {
      method: 'GET',
      path: '/auth/profile',
    })

    const profile = await profileResponse.json()

    expect(profile.teams[0].mailer.status).toEqual(
      'ACCESS_KEYS_LOST_PROVIDER_ACCESS',
    )

    SESMock.on(GetSendQuotaCommand).resolves({})

    const reconnectConfigPayload = {
      accessKey: faker.string.alphanumeric({ length: 32 }),
      accessSecret: faker.string.alphanumeric({ length: 32 }),
      region: 'us-east-1',
      domain: 'newsletter.example.com',
    }

    const reconnectResponse = await makeRequestAsUser(user, {
      method: 'PATCH',
      path: `/mailers/${mailerId}/reconnect`,
      body: {
        configuration: reconnectConfigPayload,
      },
    })

    expect(reconnectResponse.status).toBe(200)

    const mailerRepository = container.resolve(MailerRepository)

    const freshMailer = await mailerRepository.findById(mailerId)

    const configuration = mailerRepository.getDecryptedConfiguration(
      freshMailer?.configuration,
      team.configurationKey,
    )

    expect(configuration.accessKey.release()).toEqual(
      reconnectConfigPayload.accessKey,
    )
    expect(configuration.accessSecret.release()).toEqual(
      reconnectConfigPayload.accessSecret,
    )

    sleepMock.mockRestore()
  })

  test('can update mailers while creating an email sending identity', async ({
    expect,
  }) => {
    await refreshDatabase()
    const { user } = await createUser()
    const database = makeDatabase()

    const mailerPayload = {
      name: faker.string.uuid(),
      provider: 'AWS_SES',
    }

    // mock aws clients to resolve api calls.
    SESMock.onAnyCommand().resolves({})
    SNSMock.onAnyCommand().resolves({})

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/mailers',
      body: mailerPayload,
    })

    const updateConfigPayload = {
      accessKey: faker.string.alphanumeric({ length: 16 }),
      accessSecret: faker.string.alphanumeric({ length: 16 }),
      region: 'us-east-1',
      email: 'from@example.com',
    }

    const updateResponse = await makeRequestAsUser(user, {
      method: 'PATCH',
      path: `/mailers/${(await response.json()).id}`,
      body: {
        configuration: updateConfigPayload,
      },
    })

    expect(updateResponse.status).toBe(200)

    const mailer = await database.query.mailers.findFirst({
      where: eq(mailers.name, mailerPayload.name),
      with: {
        identities: true,
      },
    })

    expect(mailer).not.toBeNull()
    const domainIdentity = mailer?.identities.find(
      (identity) =>
        identity.type === 'EMAIL' &&
        identity.value === updateConfigPayload.email,
    )

    expect(domainIdentity).not.toBeNull()
    expect(domainIdentity?.configuration).toBe(null)
    expect(domainIdentity?.status).toBe('PENDING')

    const thirdCallToCreateEmailIdentityCommand = SESMock.calls()[2]

    expect(thirdCallToCreateEmailIdentityCommand.args[0]).toBeInstanceOf(
      CreateEmailIdentityCommand,
    )
    expect(thirdCallToCreateEmailIdentityCommand.args[0].input).toEqual({
      EmailIdentity: updateConfigPayload.email,
      ConfigurationSetName: `${makeConfig().software.shortName}_${mailer?.id}`,
    })
  })

  test('cannot update mailer without providing a sender identity, either a domain or email', async ({
    expect,
  }) => {
    await refreshDatabase()
    const { user, team } = await createUser()
    const database = makeDatabase()

    const mailerPayload = {
      name: faker.string.uuid(),
      provider: 'AWS_SES',
    }

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/mailers',
      body: mailerPayload,
    })

    const updateConfigPayload = {
      accessKey: faker.string.alphanumeric({ length: 16 }),
      accessSecret: faker.string.alphanumeric({ length: 16 }),
      region: 'us-east-1',
    }

    const updateResponse = await makeRequestAsUser(user, {
      method: 'PATCH',
      path: `/mailers/${(await response.json()).id}`,
      body: {
        configuration: updateConfigPayload,
      },
    })

    expect(await updateResponse.json()).toEqual({
      message: 'Validation failed.',
      errors: [
        {
          message:
            'Either domain or email must be provided to enable sending emails.',
        },
      ],
    })

    const mailerRepository = container.resolve(MailerRepository)

    const mailer = await database.query.mailers.findFirst({
      where: eq(mailers.name, mailerPayload.name),
      with: {
        identities: true,
      },
    })

    const decryptedConfiguration = mailerRepository.getDecryptedConfiguration(
      mailer?.configuration ?? '',
      team?.configurationKey,
    )

    // make sure keys were not saved and config was not updated.
    expect(decryptedConfiguration.accessKey.release()).toBe('')
    expect(decryptedConfiguration.accessSecret.release()).toBe('')
  })

  test('can fetch all mailers and see sending domain approval status when fetching user profile', async ({
    expect,
  }) => {
    const { user } = await createUser({ createMailerWithIdentity: true })

    SESMock.reset()
    SESMock.resetHistory()

    SESMock.on(GetIdentityDkimAttributesCommand).resolves({
      DkimAttributes: {
        'newsletter.example.com': {
          DkimEnabled: true,
          DkimVerificationStatus: 'Success',
          DkimTokens: [],
        },
      },
    })

    SESMock.on(GetIdentityVerificationAttributesCommand).resolves({
      VerificationAttributes: {
        'newsletter.example.com': {
          VerificationStatus: 'Success',
          VerificationToken: faker.string.alphanumeric(),
        },
      },
    })

    SESMock.on(GetIdentityMailFromDomainAttributesCommand).resolves({
      MailFromDomainAttributes: {
        'newsletter.example.com': {
          BehaviorOnMXFailure: BehaviorOnMXFailure.UseDefaultValue,
          MailFromDomain: 'send.newsletter.example.com',
          MailFromDomainStatus: 'Success',
        },
      },
    })

    SESMock.on(GetAccountSendingEnabledCommand).resolves({ Enabled: true })
    SESMock.on(GetSendQuotaCommand).resolves({
      Max24HourSend: 10000,
      MaxSendRate: 10,
      SentLast24Hours: 1023,
    })

    const response = await makeRequestAsUser(user, {
      method: 'GET',
      path: '/auth/profile',
    })

    const json = await response.json()

    expect(json.teams[0].mailer.status).toBe('READY')
    expect(json.teams[0].mailer.identities[0].status).toBe('APPROVED')

    const database = makeDatabase()

    const mailer = await database.query.mailers.findFirst({
      where: eq(mailers.id, json.teams[0].mailer.id),
    })

    expect(mailer).not.toBeNull()

    expect(mailer?.sendingEnabled).toBe(true)
    expect(mailer?.maxSendRate).toBe(10)
    expect(mailer?.max24HourSend).toBe(10000)
  })

  test('when fetching profile, a mailer sync error with provider does not prevent results from being fetched', async ({
    expect,
  }) => {
    const { user } = await createUser({ createMailerWithIdentity: true })

    SESMock.on(GetIdentityDkimAttributesCommand).rejects({
      message: 'InvalidParameterValue',
    })

    SESMock.on(GetIdentityVerificationAttributesCommand).resolves({
      VerificationAttributes: {
        'newsletter.example.com': {
          VerificationStatus: 'Success',
          VerificationToken: faker.string.alphanumeric(),
        },
      },
    })

    SESMock.on(GetIdentityMailFromDomainAttributesCommand).resolves({
      MailFromDomainAttributes: {
        'newsletter.example.com': {
          BehaviorOnMXFailure: BehaviorOnMXFailure.UseDefaultValue,
          MailFromDomain: 'send.newsletter.example.com',
          MailFromDomainStatus: 'Success',
        },
      },
    })

    SESMock.on(GetAccountSendingEnabledCommand).resolves({ Enabled: true })
    SESMock.on(GetSendQuotaCommand).resolves({
      Max24HourSend: 10000,
      MaxSendRate: 10,
      SentLast24Hours: 1023,
    })

    const response = await makeRequestAsUser(user, {
      method: 'GET',
      path: '/auth/profile',
    })

    const json = await response.json()

    expect(json.teams[0].mailer.status).toBe('PENDING')
    expect(json.teams[0].mailer.identities[0].status).toBe('PENDING')
  })

  test('when fetching profile, a mailer loss in credential access results in a flag on the mailer showing loss of aws access, but also allows request to go through', async ({
    expect,
  }) => {
    const { user } = await createUser({ createMailerWithIdentity: true })

    SESMock.reset()
    SESMock.resetHistory()

    SESMock.on(GetSendQuotaCommand).rejects({})
    SESMock.on(ListIdentitiesCommand).rejects({})
    SNSMock.on(ListTopicsCommand).rejects({})

    const response = await makeRequestAsUser(user, {
      method: 'GET',
      path: '/auth/profile',
    })

    const json = await response.json()

    expect(json.teams[0].mailer.status).toBe('ACCESS_KEYS_LOST_PROVIDER_ACCESS')
    expect(json.teams[0].mailer.identities[0].status).toBe('PENDING')
  })
})

describe('Mailer identities', () => {
  beforeEach(() => {
    SESMock.reset()
    SESMock.resetHistory()
  })

  test('can create a domain mailer identity', async ({ expect }) => {
    const { user, team } = await createUser({ createMailerWithIdentity: true })

    SESMock.reset()
    SESMock.resetHistory()

    SESMock.on(CreateEmailIdentityCommand).resolves({})
    SESMock.on(SetIdentityMailFromDomainCommand).resolves({})

    const database = makeDatabase()

    const mailerIdentityRepository = container.resolve(MailerIdentityRepository)

    const mailer = await database.query.mailers.findFirst({
      where: eq(mailers.teamId, team?.id),
    })

    const mailerIdentityPayload = {
      type: 'DOMAIN',
      value: 'marketing.gorillaxample.com',
    }

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/mailers/${mailer?.id}/identities`,
      body: mailerIdentityPayload,
    })

    expect(response.status).toBe(200)

    const mailerIdentity = await database.query.mailerIdentities.findFirst({
      where: and(
        eq(mailerIdentities.mailerId, mailer?.id ?? ''),
        eq(mailerIdentities.value, mailerIdentityPayload.value),
      ),
    })

    const decryptedMailerIdentityRsaPrivateKey =
      await mailerIdentityRepository.decryptRsaPrivateKey(
        team?.configurationKey,
        (mailerIdentity?.configuration as Record<string, string>).privateKey,
      )

    const config = makeConfig()
    const configurationName = `${config.software.shortName}_${mailer?.id}`

    const SesCalls = SESMock.calls()

    const createEmailIdentityCall = SesCalls[0]
    const setIdentityMailFromDomain = SesCalls[1]

    expect(createEmailIdentityCall.args[0]).toBeInstanceOf(
      CreateEmailIdentityCommand,
    )

    expect(createEmailIdentityCall.args[0].input).toEqual({
      EmailIdentity: mailerIdentityPayload.value,
      ConfigurationSetName: configurationName,
      DkimSigningAttributes: {
        DomainSigningPrivateKey:
          decryptedMailerIdentityRsaPrivateKey.privateKey.release(),
        DomainSigningSelector: config.software.shortName,
      },
    })

    expect(setIdentityMailFromDomain.args[0]).toBeInstanceOf(
      SetIdentityMailFromDomainCommand,
    )

    expect(setIdentityMailFromDomain.args[0].input).toEqual({
      Identity: mailerIdentityPayload.value,
      MailFromDomain: `send.${mailerIdentityPayload.value}`,
      BehaviorOnMXFailure: BehaviorOnMXFailure.UseDefaultValue,
    })
  })

  test('can create an email mailer identity', async ({ expect }) => {
    await refreshDatabase()
    const { user, team } = await createUser({ createMailerWithIdentity: true })

    SESMock.reset()
    SESMock.resetHistory()

    SESMock.on(CreateEmailIdentityCommand).resolves({})
    SESMock.on(SetIdentityMailFromDomainCommand).resolves({})

    const database = makeDatabase()

    const mailer = await database.query.mailers.findFirst({
      where: eq(mailers.teamId, team?.id),
    })

    const mailerIdentityPayload = {
      type: 'EMAIL',
      value: 'hello@gorillaxample.com',
    }

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/mailers/${mailer?.id}/identities`,
      body: mailerIdentityPayload,
    })

    expect(response.status).toBe(200)

    const config = makeConfig()
    const configurationName = `${config.software.shortName}_${mailer?.id}`

    const SesCalls = SESMock.calls()

    const createEmailIdentityCall = SesCalls[0]

    expect(createEmailIdentityCall.args[0]).toBeInstanceOf(
      CreateEmailIdentityCommand,
    )

    expect(createEmailIdentityCall.args[0].input).toEqual({
      EmailIdentity: mailerIdentityPayload.value,
      ConfigurationSetName: configurationName,
    })
  })

  test('can delete a mailer identity', async ({ expect }) => {
    await refreshDatabase()

    const { user, team } = await createUser({ createMailerWithIdentity: true })

    SESMock.reset()
    SESMock.resetHistory()

    SESMock.on(DeleteEmailIdentityCommand).resolves({})

    const database = makeDatabase()

    const mailer = await database.query.mailers.findFirst({
      where: eq(mailers.teamId, team?.id),
      with: {
        identities: true,
      },
    })

    const identity = mailer?.identities[0]

    const deleteIdentityResponse = await makeRequestAsUser(user, {
      method: 'DELETE',
      path: `/mailers/${mailer?.id}/identities/${identity?.id}`,
      body: {
        deleteOnProvider: true,
      },
    })

    expect(deleteIdentityResponse.status).toBe(200)

    const deletedMailerIdentity =
      await database.query.mailerIdentities.findFirst({
        where: eq(mailerIdentities.id, identity?.id ?? ''),
      })

    expect(deletedMailerIdentity).toBeUndefined()

    const SESCalls = SESMock.calls()

    const deleteEmailIdentityCall = SESCalls[2]

    expect(deleteEmailIdentityCall.args[0]).toBeInstanceOf(
      DeleteIdentityCommand,
    )
    expect(deleteEmailIdentityCall.args[0].input).toEqual({
      Identity: identity?.value,
    })
  })

  test('sees a clear message if deleting a mailer identity fails on provider', async ({
    expect,
  }) => {
    await refreshDatabase()

    const { user, team } = await createUser({ createMailerWithIdentity: true })

    SESMock.reset()
    SESMock.resetHistory()

    const providerErrorMessage = 'Your account payments are overdue.'

    SESMock.on(DeleteIdentityCommand).rejects({
      message: providerErrorMessage,
    })

    const database = makeDatabase()

    const mailer = await database.query.mailers.findFirst({
      where: eq(mailers.teamId, team?.id),
      with: {
        identities: true,
      },
    })

    const identity = mailer?.identities[0]

    const deleteIdentityResponse = await makeRequestAsUser(user, {
      method: 'DELETE',
      path: `/mailers/${mailer?.id}/identities/${identity?.id}`,
      body: {
        deleteOnProvider: true,
      },
    })

    expect(deleteIdentityResponse.status).toBe(500)
    const json = await deleteIdentityResponse.json()

    expect(json.message).toContain(providerErrorMessage)

    const deletedMailerIdentity =
      await database.query.mailerIdentities.findFirst({
        where: eq(mailerIdentities.id, identity?.id ?? ''),
      })

    expect(deletedMailerIdentity).not.toBeNull()
  })

  test('can refresh a mailer identity if verification failed', async ({
    expect,
  }) => {
    await refreshDatabase()

    const { user, team } = await createUser({ createMailerWithIdentity: true })

    SESMock.reset()
    SESMock.resetHistory()

    const database = makeDatabase()

    const mailer = await database.query.mailers.findFirst({
      where: eq(mailers.teamId, team?.id),
      with: {
        identities: true,
      },
    })

    const identity = mailer?.identities[0]

    SESMock.on(GetIdentityDkimAttributesCommand).resolves({
      DkimAttributes: {
        'newsletter.example.com': {
          DkimEnabled: true,
          DkimVerificationStatus: 'Failed',
          DkimTokens: [],
        },
      },
    })

    // refresh
    await makeRequestAsUser(user, {
      method: 'GET',
      path: '/auth/profile',
    })

    SESMock.reset()
    SESMock.resetHistory()

    const refreshIdentityResponse = await makeRequestAsUser(user, {
      method: 'POST',
      path: `/mailers/${mailer?.id}/identities/${identity?.id}/refresh`,
    })

    const deleteIdentityCall = SESMock.calls()[2]
    const createIdentityCall = SESMock.calls()[3]
    const setIdentityMailFromCall = SESMock.calls()[4]

    expect(deleteIdentityCall.args[0]).toBeInstanceOf(DeleteIdentityCommand)
    expect(createIdentityCall.args[0]).toBeInstanceOf(
      CreateEmailIdentityCommand,
    )
    expect(setIdentityMailFromCall.args[0]).toBeInstanceOf(
      SetIdentityMailFromDomainCommand,
    )

    expect(
      (createIdentityCall.args[0].input as Record<string, string>)
        .EmailIdentity,
    ).toEqual(identity?.value)

    expect(refreshIdentityResponse.status).toBe(200)
  })
})
