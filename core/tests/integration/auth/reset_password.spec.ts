import { randomBytes } from 'node:crypto'
import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { PasswordResetRepository } from '#root/core/auth/password_resets/repositories/password_reset_repository.js'

import { createUser } from '#root/core/tests/mocks/auth/users.js'
import { makeRequest } from '#root/core/tests/utils/http.js'

import { passwordResets } from '#root/database/schema.js'

import { route } from '#root/core/shared/routes/route_aliases.js'
import { TokenGenerator } from '#root/core/shared/tokens/token_generator.js'

import { container } from '#root/core/utils/typi.js'

describe('@auth password resets', () => {
  it('a user can request and reset their password', async ({ expect }) => {
    const { user } = await createUser()

    const passwordResetToken = randomBytes(32).toString('hex')

    container.fake(TokenGenerator, {
      generate() {
        return passwordResetToken
      },
    })

    const response = await makeRequest('/auth/passwords/forgot', {
      method: 'POST',
      body: {
        email: user.email,
      },
    })

    expect(response.status).toBe(200)

    const getUserPasswordResets = () =>
      container
        .make(PasswordResetRepository)
        .resets()
        .findAll(eq(passwordResets.userId, user.id))

    const [userPasswordReset] = await getUserPasswordResets()

    expect(userPasswordReset).toBeDefined()

    const newPassword = faker.internet.password()

    const resetResponse = await makeRequest(
      `/auth/passwords/reset/${passwordResetToken}`,
      {
        method: 'POST',
        body: {
          email: user.email,
          password: newPassword,
          passwordConfirm: newPassword,
        },
      },
    )

    expect(resetResponse.status).toBe(200)

    const updatedUserPasswordResets = await getUserPasswordResets()

    expect(updatedUserPasswordResets).toHaveLength(0)

    const loginResponse = await makeRequest('/auth/login/', {
      method: 'POST',
      body: {
        email: user.email,
        password: newPassword,
        passwordConfirm: newPassword,
      },
    })

    const json = await loginResponse.json()

    expect(json.type).toEqual('redirect')
    expect(json.payload.path).toEqual(route('dashboard'))
    expect(json.payload.status).toEqual(302)
  })
})
