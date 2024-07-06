import { SESClient } from "@aws-sdk/client-ses"
import { SNSClient } from "@aws-sdk/client-sns"
import { faker } from "@faker-js/faker"
import { mockClient } from "aws-sdk-client-mock"
import { container } from "tsyringe"

import { AudienceRepository } from "@/domains/audiences/repositories/audience_repository.js"
import { RegisterUserAction } from "@/domains/auth/actions/register_user_action.js"
import { makeDatabase } from "@/infrastructure/container.js"
import { injectAsUser } from "@/tests/utils/http.js"

export const createUser = async ({
  createMailerWithIdentity,
}: {
  createMailerWithIdentity?: boolean
} = {}) => {
  const database = makeDatabase()

  const setting = await database.setting.upsert({
    where: {
      domain: "marketing.example.com",
    },
    create: {
      url: "https://marketing.example.com",
      domain: "marketing.example.com",
    },
    update: {},
  })

  const audienceRepository = container.resolve(AudienceRepository)

  const registerUserAction = container.resolve(RegisterUserAction)

  const { user, team } = await registerUserAction.handle({
    name: faker.person.fullName(),
    email: faker.internet.exampleEmail(),
    password: "password",
  })

  const audience = await audienceRepository.createAudience(
    { name: "Newsletter" },
    team!.id,
  )

  const freshUser = await database.user.findFirst({
    where: { email: user.email },
    include: {
      teams: true,
    },
  })

  if (createMailerWithIdentity) {
    const response = await injectAsUser(freshUser!, {
      method: "POST",
      path: "/mailers",
      body: {
        name: faker.string.uuid(),
        provider: "AWS_SES",
      },
    })

    mockClient(SESClient).onAnyCommand().resolves({})
    mockClient(SNSClient).onAnyCommand().resolves({})

    await injectAsUser(freshUser!, {
      method: "PATCH",
      path: `/mailers/${(await response.json()).id}`,
      body: {
        configuration: {
          accessKey: faker.string.alphanumeric({ length: 24 }),
          accessSecret: faker.string.alphanumeric({ length: 24 }),
          region: "us-east-1",
          domain: "newsletter.example.com",
        },
      },
    })
  }

  return { user: freshUser!, team, audience, setting }
}
