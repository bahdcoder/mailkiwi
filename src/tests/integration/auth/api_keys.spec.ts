import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { describe, test } from 'vitest'

import { makeApp, makeDatabase, makeEnv } from '@/shared/container/index.js'
import { accessTokens, teams, users } from '@/database/schema/schema.js'
import { createUser } from '@/tests/mocks/auth/users.js'
import { makeRequest, makeRequestAsUser } from '@/tests/utils/http.js'
import { container } from '@/utils/typi.ts'
import { RedisKeySetter } from '@/redis/redis_commands.ts'
import { Encryption } from '@/shared/utils/encryption/encryption.ts'
import { AccessTokenRepository } from '@/auth/acess_tokens/repositories/access_token_repository.ts'
import { Secret } from '@poppinss/utils'

describe('API Token Generation', () => {
  test('can generate an api token for api and smtp access', async ({
    expect,
  }) => {
    const database = makeDatabase()

    const { user, team } = await createUser()

    // const payload = {
    //   name: faker.person.fullName(),
    //   email: faker.internet.exampleEmail(),
    //   password: '@Dx93opPisxYee#$%^',
    // }

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/api-keys',
    })

    const accessKeysFromDatabase = await database.query.accessTokens.findFirst({
      where: eq(accessTokens.teamId, team.id),
    })

    d(accessKeysFromDatabase)

    expect(response.status).toBe(200)

    const keyInRedis = await container
      .make(RedisKeySetter)
      .entity(team.id)
      .get('TEAM_API_KEY')

    expect(keyInRedis).toBeDefined()

    const decryptedApiKey = new Encryption(makeEnv().APP_KEY).decrypt(
      keyInRedis as string,
    )

    const verifiedToken = await container
      .resolve(AccessTokenRepository)
      .verifyToken(new Secret(decryptedApiKey as string))

    expect(verifiedToken).toBeDefined()
  })
})
