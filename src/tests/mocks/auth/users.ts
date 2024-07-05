import { faker } from "@faker-js/faker"
import { container } from "tsyringe"

import { AudienceRepository } from "@/domains/audiences/repositories/audience_repository"
import { RegisterUserAction } from "@/domains/auth/actions/register_user_action"
import { makeDatabase } from "@/infrastructure/container"
import { injectAsUser } from "@/tests/utils/http"

export const createUser = async ({
  createMailerWithIdentity,
}: {
  createMailerWithIdentity?: boolean
} = {}) => {
  const database = makeDatabase()
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

    await injectAsUser(freshUser!, {
      method: "PATCH",
      path: `/mailers/${(await response.json()).id}`,
      body: {
        configuration: {
          accessKey: faker.string.alphanumeric({ length: 16 }),
          accessSecret: faker.string.alphanumeric({ length: 16 }),
          region: "us-east-1",
          domain: "newsletter.example.com",
        },
      },
    })
  }

  return { user: freshUser!, team, audience }
}
