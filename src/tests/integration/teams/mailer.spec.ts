import {
  BehaviorOnMXFailure,
  GetSendQuotaCommand,
  ListIdentitiesCommand,
  SESClient,
  SetIdentityMailFromDomainCommand,
} from "@aws-sdk/client-ses"
import { CreateEmailIdentityCommand } from "@aws-sdk/client-sesv2"
import { ListTopicsCommand, SNSClient } from "@aws-sdk/client-sns"
import { faker } from "@faker-js/faker"
import { mockClient } from "aws-sdk-client-mock"
import { container } from "tsyringe"
import { beforeEach, describe, test } from "vitest"

import { MailerIdentityRepository } from "@/domains/teams/repositories/mailer_identity_repository"
import { MailerRepository } from "@/domains/teams/repositories/mailer_repository"
import { makeConfig, makeDatabase } from "@/infrastructure/container"
import { createUser } from "@/tests/mocks/auth/users"
import { cleanMailers } from "@/tests/mocks/teams/teams"
import { injectAsUser } from "@/tests/utils/http"

const SESMock = mockClient(SESClient)
const SNSMock = mockClient(SNSClient)

describe("Teams", () => {
  beforeEach(() => {
    SNSMock.reset()
    SESMock.reset()
  })

  test("can create mailers", async ({ expect }) => {
    const { user } = await createUser()

    const mailerPayload = {
      name: faker.string.uuid(),
      provider: "AWS_SES",
    }

    const response = await injectAsUser(user, {
      method: "POST",
      path: "/mailers",
      body: mailerPayload,
    })

    const json = await response.json()

    expect(response.statusCode).toBe(200)
    expect(json.name).toBe(mailerPayload.name)
    expect(json.provider).toBe(mailerPayload.provider)

    await cleanMailers()
  })

  test("can update mailers while creating a domain sending identity", async ({
    expect,
  }) => {
    await cleanMailers()
    const { user, team } = await createUser()
    const database = makeDatabase()

    const mailerPayload = {
      name: faker.string.uuid(),
      provider: "AWS_SES",
    }

    const response = await injectAsUser(user, {
      method: "POST",
      path: "/mailers",
      body: mailerPayload,
    })

    const updateConfigPayload = {
      accessKey: faker.string.alphanumeric({ length: 16 }),
      accessSecret: faker.string.alphanumeric({ length: 16 }),
      region: "us-east-1",
      domain: "newsletter.example.com",
    }

    const updateResponse = await injectAsUser(user, {
      method: "PATCH",
      path: `/mailers/${(await response.json()).id}`,
      body: {
        configuration: updateConfigPayload,
      },
    })

    // mock aws clients to resolve api calls.
    SESMock.onAnyCommand().resolves({})
    SNSMock.onAnyCommand().resolves({})

    expect(updateResponse.statusCode).toBe(200)

    const mailerRepository = container.resolve(MailerRepository)

    const mailer = (await database.mailer.findFirst({
      where: {
        name: mailerPayload.name,
        provider: "AWS_SES",
      },
      include: {
        identities: true,
      },
    }))!

    expect(mailer).not.toBeNull()
    const domainIdentity = mailer.identities.find(
      (identity) =>
        identity.type === "DOMAIN" &&
        identity.value === updateConfigPayload.domain,
    )!

    expect(domainIdentity).not.toBeNull()

    expect(
      (domainIdentity.configuration as { publicKey: string }).publicKey.length,
    ).toBe(216)
    expect(domainIdentity.status).toBe("PENDING")

    const updatedConfiguration = mailerRepository.getDecryptedConfiguration(
      mailer?.configuration,
      team.configurationKey,
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
        team.configurationKey,
        (domainIdentity.configuration as { privateKey: string }).privateKey,
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
      ConfigurationSetName: `${appShortName}_${mailer.id}`,
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

  test("can update mailers while creating an email sending identity", async ({
    expect,
  }) => {
    await cleanMailers()
    const { user } = await createUser()
    const database = makeDatabase()

    const mailerPayload = {
      name: faker.string.uuid(),
      provider: "AWS_SES",
    }

    // mock aws clients to resolve api calls.
    SESMock.onAnyCommand().resolves({})
    SNSMock.onAnyCommand().resolves({})

    const response = await injectAsUser(user, {
      method: "POST",
      path: "/mailers",
      body: mailerPayload,
    })

    const updateConfigPayload = {
      accessKey: faker.string.alphanumeric({ length: 16 }),
      accessSecret: faker.string.alphanumeric({ length: 16 }),
      region: "us-east-1",
      email: "from@example.com",
    }

    const updateResponse = await injectAsUser(user, {
      method: "PATCH",
      path: `/mailers/${(await response.json()).id}`,
      body: {
        configuration: updateConfigPayload,
      },
    })

    expect(updateResponse.statusCode).toBe(200)

    const mailer = (await database.mailer.findFirst({
      where: {
        name: mailerPayload.name,
        provider: "AWS_SES",
      },
      include: {
        identities: true,
      },
    }))!

    expect(mailer).not.toBeNull()
    const domainIdentity = mailer.identities.find(
      (identity) =>
        identity.type === "EMAIL" &&
        identity.value === updateConfigPayload.email,
    )!

    expect(domainIdentity).not.toBeNull()
    expect(domainIdentity.configuration).toBe(null)
    expect(domainIdentity.status).toBe("PENDING")

    const thirdCallToCreateEmailIdentityCommand = SESMock.calls()[2]

    expect(thirdCallToCreateEmailIdentityCommand.args[0]).toBeInstanceOf(
      CreateEmailIdentityCommand,
    )
    expect(thirdCallToCreateEmailIdentityCommand.args[0].input).toEqual({
      EmailIdentity: updateConfigPayload.email,
      ConfigurationSetName: `${makeConfig().software.shortName}_${mailer.id}`,
    })
  })

  test("cannot update mailer without providing a sender identity, either a domain or email", async ({
    expect,
  }) => {
    await cleanMailers()
    const { user, team } = await createUser()
    const database = makeDatabase()

    const mailerPayload = {
      name: faker.string.uuid(),
      provider: "AWS_SES",
    }

    const response = await injectAsUser(user, {
      method: "POST",
      path: "/mailers",
      body: mailerPayload,
    })

    const updateConfigPayload = {
      accessKey: faker.string.alphanumeric({ length: 16 }),
      accessSecret: faker.string.alphanumeric({ length: 16 }),
      region: "us-east-1",
    }

    const updateResponse = await injectAsUser(user, {
      method: "PATCH",
      path: `/mailers/${(await response.json()).id}`,
      body: {
        configuration: updateConfigPayload,
      },
    })

    expect(await updateResponse.json()).toEqual({
      errors: [
        {
          message:
            "Either domain or email must be provided to enable sending emails.",
          field: "configuration",
        },
      ],
    })

    const mailerRepository = container.resolve(MailerRepository)

    const mailer = (await database.mailer.findFirst({
      where: {
        name: mailerPayload.name,
        provider: "AWS_SES",
      },
      include: {
        identities: true,
      },
    }))!

    const decryptedConfiguration = mailerRepository.getDecryptedConfiguration(
      mailer.configuration,
      team.configurationKey,
    )

    // make sure keys were not saved and config was not updated.
    expect(decryptedConfiguration.accessKey.release()).toBe("")
    expect(decryptedConfiguration.accessSecret.release()).toBe("")
  })
})
