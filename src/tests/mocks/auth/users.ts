import { faker } from "@faker-js/faker"
import { container } from "tsyringe"

import { AudienceRepository } from "@/domains/audiences/repositories/audience_repository"
import { RegisterUserAction } from "@/domains/auth/actions/register_user_action"
import { makeDatabase } from "@/infrastructure/container"

export const createUser = async () => {
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

  return { user: freshUser!, team, audience }
}
