import { faker } from "@faker-js/faker"

import { CreateAudienceAction } from "@/domains/audiences/actions/audiences/create_audience_action.ts"
import { RegisterUserAction } from "@/domains/auth/actions/register_user_action.ts"
import { ContainerKey } from "@/infrastructure/container.ts"
import {
  createDatabaseClient,
  createDrizzleDatabase,
} from "@/infrastructure/database/client.js"
import { contacts, settings } from "@/infrastructure/database/schema/schema.ts"
import { env } from "@/infrastructure/env.js"
import { refreshDatabase, seedAutomation } from "@/tests/mocks/teams/teams.ts"
import { container } from "@/utils/typi.ts"

const database = createDrizzleDatabase(createDatabaseClient(env.DATABASE_URL))

container.registerInstance(ContainerKey.env, env)
container.registerInstance(ContainerKey.database, database)

const registerUserAction = container.resolve(RegisterUserAction)
const createAudienceAction = container.resolve(CreateAudienceAction)

await refreshDatabase()

await database.insert(settings).values({
  domain: "bamboomail.a.pinggy.link",
  url: "https://bamboomail.a.pinggy.link",
})

for (let userIndex = 0; userIndex < 5; userIndex++) {
  console.log(`\nCreating user: ${userIndex + 1}\n`)

  const { team } = await registerUserAction.handle({
    name: faker.person.fullName(),
    email: faker.internet.email({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    }),
    password: "password",
  })

  for (let audienceIndex = 0; audienceIndex < 1; audienceIndex++) {
    const audiencePayload = { name: faker.commerce.productName() }

    console.log(
      "Creating audience: ",
      `${audienceIndex}: ${audiencePayload.name}`,
    )

    const audience = await createAudienceAction.handle(audiencePayload, team.id)

    await seedAutomation({
      audienceId: audience.id,
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
    })

    for (let times = 0; times < 50; times++) {
      const mockContacts = faker.helpers
        .multiple(faker.person.firstName, {
          count: faker.helpers.rangeToNumber({ min: 700, max: 1000 }),
        })
        .map((firstName) => ({
          firstName,
          email: faker.internet
            .email({
              firstName: `${faker.person.firstName()}.${faker.number.int({ max: 50000 })}`,
              lastName: faker.person.lastName(),
            })
            .toLowerCase(),
          lastName: faker.person.lastName(),
          audienceId: audience.id,
          subscribedAt: faker.date.past().getTime(),
          avatarUrl: faker.image.avatarGitHub(),
        }))

      console.log(
        "Inserting contacts for audience:",
        `${mockContacts.length} mock contacts.`,
      )

      await database.insert(contacts).values(mockContacts)
    }
  }
}
