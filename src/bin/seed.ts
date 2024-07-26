import { faker } from '@faker-js/faker'

import { CreateAudienceAction } from '@/domains/audiences/actions/audiences/create_audience_action.js'
import { AccessTokenRepository } from '@/domains/auth/acess_tokens/repositories/access_token_repository.ts'
import { RegisterUserAction } from '@/domains/auth/actions/register_user_action.js'
import { MailerIdentityRepository } from '@/domains/teams/repositories/mailer_identity_repository.ts'
import { MailerRepository } from '@/domains/teams/repositories/mailer_repository.ts'
import { ContainerKey } from '@/infrastructure/container.js'
import {
  createDatabaseClient,
  createDrizzleDatabase,
} from '@/infrastructure/database/client.js'
import {
  contacts,
  mailers,
  teams,
} from '@/infrastructure/database/schema/schema.js'
import type { Team } from '@/infrastructure/database/schema/types.ts'
import { env } from '@/infrastructure/env.js'
import { refreshDatabase, seedAutomation } from '@/tests/mocks/teams/teams.js'
import { container } from '@/utils/typi.js'
import { Secret } from '@poppinss/utils'
import { eq } from 'drizzle-orm'
import type { ConfigurationObjectInput } from '@/domains/teams/dto/mailers/update_mailer_dto.ts'

const connection = await createDatabaseClient(env.DATABASE_URL)

const database = createDrizzleDatabase(connection)

container.registerInstance(ContainerKey.env, env)
container.registerInstance(ContainerKey.database, database)

const registerUserAction = container.resolve(RegisterUserAction)
const createAudienceAction = container.resolve(CreateAudienceAction)

await refreshDatabase()

for (let userIndex = 0; userIndex < 1; userIndex++) {
  console.log(`\nCreating user: ${userIndex + 1}\n`)

  const { team, user } = await registerUserAction.handle({
    name: faker.person.fullName(),
    email: faker.internet.email({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    }),
    password: 'password',
  })

  const teamObject = await database.query.teams.findFirst({
    where: eq(teams.id, team.id),
  })

  // await container.make(CreateMailerAction).handle()

  // const { id: mailerId } = await container.make(MailerRepository).create(
  //   {
  //     name: faker.lorem.words(5),
  //     provider: 'AWS_SES',
  //     configuration: {
  //       accessKey: new Secret(env.TEST_AWS_KEY ?? faker.string.uuid()),
  //       accessSecret: new Secret(env.TEST_AWS_SECRET ?? faker.string.uuid()),
  //       region: (env.TEST_AWS_REGION ??
  //         'us-east-1') as ConfigurationObjectInput['region'],
  //       domain: 'newsletter.example.com',
  //       email: undefined,
  //     },
  //   },
  //   teamObject as Team,
  // )

  // await database
  //   .update(mailers)
  //   .set({ status: 'READY' })
  //   .where(eq(mailers.id, mailerId))
  //   .execute()

  // await container.make(MailerIdentityRepository).create(
  //   {
  //     value: 'newsletter.example.com',
  //     type: 'DOMAIN',
  //   },
  //   mailerId,
  // )

  const audienceIds = []

  for (let audienceIndex = 0; audienceIndex < 5; audienceIndex++) {
    const audiencePayload = { name: faker.commerce.productName() }

    console.log(
      'Creating audience: ',
      `${audienceIndex}: ${audiencePayload.name}`,
    )

    const audience = await createAudienceAction.handle(audiencePayload, team.id)

    await seedAutomation({
      audienceId: audience.id,
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
    })

    const contactsCount = faker.helpers.rangeToNumber({ min: 50, max: 1000 })

    audienceIds.push({ audienceId: audience.id, contactsCount })

    const mockContacts = faker.helpers
      .multiple(faker.person.firstName, {
        count: contactsCount,
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
        subscribedAt: faker.date.past(),
        avatarUrl: faker.image.avatarGitHub(),
      }))

    console.log(
      'Inserting contacts for audience:',
      `${mockContacts.length} mock contacts.`,
    )

    await database.insert(contacts).values(mockContacts)
  }

  console.log('\n Seeded data ✅ \n')

  const accessToken = await container
    .make(AccessTokenRepository)
    .createAccessToken(user)

  console.dir(
    [
      [{ userId: user.id, accessToken: accessToken.toJSON().token }],
      [{ teamId: team.id }],
      // [{ mailerId: mailerId }],
      audienceIds,
    ],
    { depth: null },
  )
}

connection.destroy()
