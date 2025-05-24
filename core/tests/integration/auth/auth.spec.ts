import { appEnv } from '#root/core/app/env/app_env.js'
import { faker } from '@faker-js/faker'
import { eq } from 'drizzle-orm'
import { DateTime } from 'luxon'
import { describe, test } from 'vitest'

import { GithubDriver } from '#root/core/auth/oauth2_drivers/github_driver.js'
import { GoogleDriver } from '#root/core/auth/oauth2_drivers/google_driver.js'
import { UserRepository } from '#root/core/auth/users/repositories/user_repository.js'

import { createUser } from '#root/core/tests/mocks/auth/users.js'
import { makeRequest, makeRequestAsUser } from '#root/core/tests/utils/http.js'

import { oauth2Accounts, users } from '#root/database/schema.js'

import { makeApp, makeDatabase } from '#root/core/shared/container/index.js'
import { route } from '#root/core/shared/routes/route_aliases.js'
import { RedisSessionStore } from '#root/core/shared/sessions/stores/redis_session_store.js'
import { OtpGenerator } from '#root/core/shared/tokens/otp_generator.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'

import { container } from '#root/core/utils/typi.js'

describe('@auth user registration', () => {
  test('can register a new user account', async ({ expect }) => {
    const database = makeDatabase()

    const payload = {
      email: faker.internet.exampleEmail(),
    }

    const response = await makeRequest('/auth/register', {
      method: 'POST',
      body: payload,
    })

    const userFromDatabase = await database.query.users.findFirst({
      where: eq(users.email, payload.email),
    })

    expect(response.status).toBe(200)

    expect(userFromDatabase).toBeDefined()
  })

  test('can only register with an email once and not twice', async ({ expect }) => {
    const app = makeApp()

    const { user } = await createUser()

    const response = await app.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: user.email,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const json = await response.json()

    expect(response.status).toEqual(422)
    expect(json.payload.errors).toMatchObject([
      {
        message:
          'A user with this email already exists. Are you trying to login instead?',
      },
    ])
  })

  test('can confirm email with verification code and set new password', async ({
    expect,
  }) => {
    const database = makeDatabase()

    const payload = {
      email: faker.number.bigInt() + faker.internet.exampleEmail(),
    }

    const MOCK_VERIFICATION_CODE = 123456

    container.fake(OtpGenerator, {
      generate() {
        return MOCK_VERIFICATION_CODE
      },
    })

    const response = await makeRequest(route('auth_register'), {
      method: 'POST',
      body: payload,
    })

    expect(response.status).toBe(200)

    const json = await response.json()

    expect(json.type).toBe('redirect')
    expect(json.payload.path).toBe(route('auth_register_email_confirm'))

    const [user] = await database
      .select()
      .from(users)
      .where(eq(users.email, payload.email))

    const userWithTeams = await container.make(UserRepository).findById(user.id)

    const emailConfirmResponse = await makeRequestAsUser(userWithTeams, {
      method: 'POST',
      path: route('auth_register_email_confirm'),
      body: {
        code: MOCK_VERIFICATION_CODE.toString(),
      },
    })

    const emailConfirmJson = await emailConfirmResponse.json()

    expect(emailConfirmResponse.status).toBe(200)

    expect(emailConfirmJson.type).toBe('redirect')
    expect(emailConfirmJson.payload.path).toBe(route('auth_register_password'))

    const [updatedUser] = await database
      .select()
      .from(users)
      .where(eq(users.email, payload.email))

    expect(updatedUser.emailVerificationCode).toBeNull()

    container.restoreAll()

    const NEW_PASSWORD = 'new-123-Password'

    const setPasswordResponse = await makeRequestAsUser(userWithTeams, {
      method: 'POST',
      path: route('auth_register_password'),
      body: {
        password: NEW_PASSWORD,
      },
    })

    const setPasswordJson = await setPasswordResponse.json()

    expect(setPasswordJson.type).toBe('redirect')
    expect(setPasswordJson.payload.path).toBe(route('auth_register_profile'))

    const setProfileResponse = await makeRequestAsUser(userWithTeams, {
      method: 'POST',
      path: route('auth_register_profile'),
      body: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        teamName: faker.company.name(),
      },
    })

    const setProfileJson = await setProfileResponse.json()

    expect(setProfileJson.type).toBe('redirect')
    expect(setProfileJson.payload.path).toBe(route('welcome'))

    const headers = {
      'x-forwarded-for': '160.212.38.149',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
    }

    await container.make(RedisSessionStore).clear(user.id)

    const loginResponse = await makeRequest(route('auth_login'), {
      method: 'POST',
      body: {
        email: payload.email,
        password: NEW_PASSWORD,
      },
      headers,
    })

    const redisSessionsForUser = await container.make(RedisSessionStore).list(user.id)

    expect(redisSessionsForUser).toHaveLength(1)

    expect(loginResponse.headers.getSetCookie()?.[0]).toMatch('session=')
  })
})

describe('@auth user login', () => {
  test('a user can login to their account and get a valid cookie session', async ({
    expect,
  }) => {
    const { user, team } = await createUser()

    const headers = {
      'x-forwarded-for': '160.212.38.149',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
    }

    const response = await makeRequest('/auth/login', {
      method: 'POST',
      body: {
        email: user.email,
        password: 'password',
      },
      headers,
    })

    const redisSessionsForUser = await container.make(RedisSessionStore).list(user.id)

    expect(redisSessionsForUser).toHaveLength(1)

    expect(redisSessionsForUser).toEqual([
      {
        ip: headers['x-forwarded-for'],
        userAgent: headers['user-agent'],
        userId: user.id,
        currentTeamId: team.id,
        expiresAt: expect.any(String),
        createdAt: expect.any(String),
      },
    ])

    const expiry = DateTime.fromISO(redisSessionsForUser?.[0]?.expiresAt)
      .diffNow()
      .as('days')

    expect(expiry).toBeGreaterThan(29)

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.type).toBe('redirect')

    const [sessionCookie] = response.headers.getSetCookie()

    expect(sessionCookie).toBeDefined()

    const profileResponse = await makeRequest('/auth/profile', {
      method: 'GET',
      headers: {
        Cookie: sessionCookie,
      },
    })

    const profile = await profileResponse.json()

    expect(profile.id).toBe(user.id)
    expect(profile.email).toBe(user.email)
  })

  test('a user cannot login with wrong credentials.', async ({ expect }) => {
    const { user } = await createUser()
    const app = makeApp()

    const response = await app.request('/auth/login', {
      method: 'post',
      body: JSON.stringify({
        email: user.email,
        password: 'invalid-password',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const json = await response.json()

    expect(response.status).toBe(422)
    expect(json.payload.errors[0].message).toBe(
      'These credentials do not match our records.',
    )
  })

  test('can logout, destroying currently active session', async ({ expect }) => {
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      body: {},
      path: '/auth/logout',
    })

    expect(response.status).toBe(200)

    const userSessions = await container.make(RedisSessionStore).list(user.id)

    expect(userSessions).toHaveLength(0)
  })
})

describe('@oauth ', () => {
  function getFakeOauthProviderDriver(provider: string, action: string) {
    const accessToken = faker.string.uuid()
    const user = {
      email: faker.internet.exampleEmail(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      providerId: faker.string.uuid(),
    }
    // biome-ignore lint/suspicious/noExplicitAny: Test mock data
    const FakeDriver: any = {
      async handleCallback() {
        return {
          user,
          accessToken: {
            token: accessToken,
            type: 'bearer',
          },
          action,
          provider: provider,
        }
      },
      setCtx() {
        return this
      },
    }

    return { FakeDriver, user, accessToken }
  }

  test('can initiate user oauth2 register flow for github', async ({ expect }) => {
    const response = await makeRequest('/auth/register/oauth2/github/authorize', {
      method: 'GET',
    })

    expect(response.status).toBe(302)

    const cookies = response.headers.getSetCookie().join('|')

    expect(cookies).toContain('gh_oauth_state=')
    expect(cookies).toContain('gh_action=register')

    const location = response.headers.get('Location')

    const url = new URL(location as string)
    const query = Object.fromEntries(url.searchParams.entries())

    expect(location).toContain('https://github.com/login/oauth/authorize?redirect_uri=')

    expect(query.scope).toEqual('user:email read:user')
    expect(query.client_id).toEqual(appEnv.OAUTH_GITHUB_CLIENT_ID)
    expect(query.redirect_uri).toEqual(appEnv.OAUTH_GITHUB_CALLBACK_URL)
    expect(query.state).toBeDefined()
  })

  test('can initiate user oauth2 login flow for google', async ({ expect }) => {
    const response = await makeRequest('/auth/login/oauth2/google/authorize', {
      method: 'GET',
    })

    expect(response.status).toBe(302)

    const cookies = response.headers.getSetCookie().join('|')

    expect(cookies).toContain('google_oauth_state=')
    expect(cookies).toContain('google_action=login')

    const location = response.headers.get('Location')

    const url = new URL(location as string)
    const query = Object.fromEntries(url.searchParams.entries())

    expect(location).toContain('https://accounts.google.com/o/oauth2/v2/auth')
    expect(query.state).toBeDefined()
    expect(query.response_type).toBe('code')
    expect(query.access_type).toBe('offline')
    expect(query.prompt).toBe('select_account')
    expect(query.client_id).toBe(appEnv.OAUTH_GOOGLE_CLIENT_ID)
    expect(query.scope).toBe(
      'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
    )
  })

  test(
    'can handle a user registration callback authorization from google',
    { retry: 3 },
    async ({ expect }) => {
      const { FakeDriver, user } = getFakeOauthProviderDriver('google', 'register')
      container.fake(GoogleDriver, FakeDriver)

      const response = await makeRequest('/auth/oauth2/google/callback', {
        method: 'GET',
      })

      const cookies = response.headers.getSetCookie()

      expect(cookies?.[0]).toContain('session=')

      const json = await response.json()

      expect(json.type).toBe('redirect')
      expect(json.payload.path).toBe(route('auth_register_profile'))

      const [userFromDatabase] = await makeDatabase()
        .select()
        .from(users)
        .where(eq(users.email, user.email))

      const [accountFromDatabase] = await makeDatabase()
        .select()
        .from(oauth2Accounts)
        .where(eq(oauth2Accounts.providerId, user.providerId))

      expect(userFromDatabase).toBeDefined()
      expect(accountFromDatabase?.userId).toEqual(userFromDatabase.id)

      container.restoreAll()
    },
  )

  test('user registration with github oauth fails if user is already registered', async ({
    expect,
  }) => {
    const { FakeDriver, user } = getFakeOauthProviderDriver('github', 'register')
    container.fake(GithubDriver, FakeDriver)

    await makeDatabase().insert(users).values({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    })

    const response = await makeRequest('/auth/oauth2/github/callback', {
      method: 'GET',
    })

    const json = await response.json()

    expect(json.type).toBe('redirect')
    expect(json.payload.path).toContain(route('auth_register'))

    container.restoreAll()
  })

  test('user can login with github after previous registration', async ({ expect }) => {
    const { FakeDriver, user } = getFakeOauthProviderDriver('github', 'login')
    container.fake(GithubDriver, FakeDriver)

    const userId = cuid()

    await makeDatabase().insert(users).values({
      id: userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    })

    await makeDatabase().insert(oauth2Accounts).values({
      userId,
      provider: 'github',
      providerId: user.providerId,
      accessToken: faker.string.uuid(),
    })

    const response = await makeRequest('/auth/oauth2/github/callback', {
      method: 'GET',
    })

    const json = await response.json()

    expect(json.type).toBe('redirect')
    expect(json.payload.path).toEqual(route('dashboard'))

    container.restoreAll()
  })

  test('user cannot login with github if not previously registered with github', async ({
    expect,
  }) => {
    const { FakeDriver, user } = getFakeOauthProviderDriver('github', 'login')
    container.fake(GithubDriver, FakeDriver)

    const response = await makeRequest('/auth/oauth2/github/callback', {
      method: 'GET',
    })

    const cookies = response.headers.getSetCookie()?.[0]?.split(';')?.[0]?.split('=')?.[1]

    const flash = JSON.parse(decodeURIComponent(cookies))

    expect(flash).toEqual({
      title: 'We could not find a user with this github account.',
      description: "Please register a new account if you haven't done so before.",
      variant: 'error',
    })

    const json = await response.json()

    expect(json.type).toBe('redirect')
    expect(json.payload.path).toEqual(route('auth_login'))

    container.restoreAll()
  })
})

describe('@auth password change', () => {
  test('user can successfully change their password', async ({ expect }) => {
    const { user } = await createUser()

    const newPassword = 'NewPassword123'

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/passwords/change',
      body: {
        password: 'password',
        newPassword,
        confirmNewPassword: newPassword,
      },
    })

    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.type).toBe('json')
    expect(json.payload.message).toBe('Password changed successfully')

    const loginResponse = await makeRequest('/auth/login', {
      method: 'POST',
      body: {
        email: user.email,
        password: newPassword,
      },
    })

    expect(loginResponse.status).toBe(200)
  })

  test('user cannot change password with incorrect current password', async ({
    expect,
  }) => {
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/passwords/change',
      body: {
        password: 'wrong-password',
        newPassword: 'NewPassword123',
        confirmNewPassword: 'NewPassword123',
      },
    })

    expect(response.status).toBe(422)

    const json = await response.json()
    expect(json.payload.errors).toMatchObject([
      {
        message: 'Your current password is incorrect.',
        field: 'password',
      },
    ])
  })

  test('user cannot change password when confirmation does not match', async ({
    expect,
  }) => {
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/passwords/change',
      body: {
        password: 'password',
        newPassword: 'NewPassword123',
        confirmNewPassword: 'DifferentPassword123',
      },
    })

    expect(response.status).toBe(422)

    const json = await response.json()
    expect(json.payload.errors).toMatchObject([
      {
        message: 'Please make sure your confirm password matches your new password.',
        field: 'confirmNewPassword',
      },
    ])
  })

  test('new password must contain uppercase letter', async ({ expect }) => {
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/passwords/change',
      body: {
        password: 'password',
        newPassword: 'newpassword123',
        confirmNewPassword: 'newpassword123',
      },
    })

    expect(response.status).toBe(422)

    const json = await response.json()
    expect(json.payload.errors).toMatchObject([
      {
        message:
          'Your new password must contain at least one capital letter for security',
        field: 'newPassword',
      },
    ])
  })

  test('new password must contain lowercase letter', async ({ expect }) => {
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/passwords/change',
      body: {
        password: 'password',
        newPassword: 'NEWPASSWORD123',
        confirmNewPassword: 'NEWPASSWORD123',
      },
    })

    expect(response.status).toBe(422)

    const json = await response.json()
    expect(json.payload.errors).toMatchObject([
      {
        message:
          'Your new password must contain at least one lowercase letter for security',
        field: 'newPassword',
      },
    ])
  })

  test('new password must contain number', async ({ expect }) => {
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/passwords/change',
      body: {
        password: 'password',
        newPassword: 'NewPassword',
        confirmNewPassword: 'NewPassword',
      },
    })

    expect(response.status).toBe(422)

    const json = await response.json()
    expect(json.payload.errors).toMatchObject([
      {
        message: 'Your new password must contain at least one number for security',
        field: 'newPassword',
      },
    ])
  })

  test('current password is required', async ({ expect }) => {
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/passwords/change',
      body: {
        newPassword: 'NewPassword123',
        confirmNewPassword: 'NewPassword123',
      },
    })

    expect(response.status).toBe(422)

    const json = await response.json()
    expect(json.payload.errors).toMatchObject([
      {
        message: 'Current password is required',
        field: 'password',
      },
    ])
  })

  test('new password is required', async ({ expect }) => {
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/passwords/change',
      body: {
        password: 'password',
        confirmNewPassword: 'NewPassword123',
      },
    })

    expect(response.status).toBe(422)

    const json = await response.json()
    expect(json.payload.errors).toMatchObject([
      {
        message: 'New password must be a text value',
        field: 'newPassword',
      },
    ])
  })

  test('confirm new password is required', async ({ expect }) => {
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/passwords/change',
      body: {
        password: 'password',
        newPassword: 'NewPassword123',
      },
    })

    expect(response.status).toBe(422)

    const json = await response.json()
    expect(json.payload.errors).toMatchObject([
      {
        message: 'Please confirm your new password',
        field: 'confirmNewPassword',
      },
    ])
  })
})

describe('@auth email change', () => {
  test('user can successfully change their email address', async ({ expect }) => {
    const { user } = await createUser()
    const newEmail = faker.internet.exampleEmail()

    const MOCK_VERIFICATION_CODE = 123456

    container.fake(OtpGenerator, {
      generate() {
        return MOCK_VERIFICATION_CODE
      },
    })

    const initiateResponse = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/email/change/initiate',
      body: {
        email: newEmail,
      },
    })

    expect(initiateResponse.status).toBe(200)

    const initiateJson = await initiateResponse.json()
    expect(initiateJson.type).toBe('json')
    expect(initiateJson.payload.message).toBe(
      'Verification code sent to your new email address',
    )

    const confirmResponse = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/email/change/confirm',
      body: {
        code: MOCK_VERIFICATION_CODE.toString(),
      },
    })

    expect(confirmResponse.status).toBe(200)

    const confirmJson = await confirmResponse.json()
    expect(confirmJson.type).toBe('json')
    expect(confirmJson.payload.message).toBe('Email address updated successfully')

    const updatedUser = await container.make(UserRepository).findById(user.id)
    expect(updatedUser?.email).toBe(newEmail)
    expect(updatedUser?.unconfirmedEmail).toBeNull()
    expect(updatedUser?.emailVerifiedAt).toBeDefined()

    container.restoreAll()
  })

  test('user cannot initiate email change with same email', async ({ expect }) => {
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/email/change/initiate',
      body: {
        email: user.email,
      },
    })

    expect(response.status).toBe(422)

    const json = await response.json()
    expect(json.payload.errors).toMatchObject([
      {
        message: 'The new email address must be different from your current email.',
        field: 'email',
      },
    ])
  })

  test('user cannot initiate email change with existing email', async ({ expect }) => {
    const { user } = await createUser()
    const { user: existingUser } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/email/change/initiate',
      body: {
        email: existingUser.email,
      },
    })

    expect(response.status).toBe(422)

    const json = await response.json()
    expect(json.payload.errors).toMatchObject([
      {
        message: 'This email address is already in use by another account.',
        field: 'email',
      },
    ])
  })

  test('user cannot confirm email change without initiating first', async ({
    expect,
  }) => {
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/email/change/confirm',
      body: {
        code: '123456',
      },
    })

    expect(response.status).toBe(422)

    const json = await response.json()
    expect(json.payload.errors).toMatchObject([
      {
        message: 'No email change request found. Please initiate an email change first.',
        field: 'code',
      },
    ])
  })

  test('user cannot confirm email change with invalid code', async ({ expect }) => {
    const { user } = await createUser()
    const newEmail = faker.internet.exampleEmail()

    const MOCK_VERIFICATION_CODE = 123456

    container.fake(OtpGenerator, {
      generate() {
        return MOCK_VERIFICATION_CODE
      },
    })

    await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/email/change/initiate',
      body: {
        email: newEmail,
      },
    })

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/email/change/confirm',
      body: {
        code: '999999',
      },
    })

    expect(response.status).toBe(422)

    const json = await response.json()
    expect(json.payload.errors).toMatchObject([
      {
        message: 'Invalid or expired verification code. Please try again.',
        field: 'code',
      },
    ])

    container.restoreAll()
  })

  test('user can cancel email change request', async ({ expect }) => {
    const { user } = await createUser()
    const newEmail = faker.internet.exampleEmail()

    const MOCK_VERIFICATION_CODE = 123456

    container.fake(OtpGenerator, {
      generate() {
        return MOCK_VERIFICATION_CODE
      },
    })

    await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/email/change/initiate',
      body: {
        email: newEmail,
      },
    })

    const cancelResponse = await makeRequestAsUser(user, {
      method: 'DELETE',
      path: '/auth/email/change/cancel',
      body: {},
    })

    expect(cancelResponse.status).toBe(200)

    const cancelJson = await cancelResponse.json()
    expect(cancelJson.type).toBe('json')
    expect(cancelJson.payload.message).toBe('Email change request cancelled successfully')

    const updatedUser = await container.make(UserRepository).findById(user.id)
    expect(updatedUser?.email).toBe(user.email)
    expect(updatedUser?.unconfirmedEmail).toBeNull()

    container.restoreAll()
  })

  test('user cannot cancel email change without pending request', async ({ expect }) => {
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: 'DELETE',
      path: '/auth/email/change/cancel',
      body: {},
    })

    expect(response.status).toBe(422)

    const json = await response.json()
    expect(json.payload.errors).toMatchObject([
      {
        message: 'No email change request found to cancel.',
      },
    ])
  })

  test('email is required for initiate', async ({ expect }) => {
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/email/change/initiate',
      body: {},
    })

    expect(response.status).toBe(422)

    const json = await response.json()
    expect(json.payload.errors).toMatchObject([
      {
        message: 'Email must be a text value',
        field: 'email',
      },
    ])
  })

  test('email must be valid format', async ({ expect }) => {
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/email/change/initiate',
      body: {
        email: 'invalid-email',
      },
    })

    expect(response.status).toBe(422)

    const json = await response.json()
    expect(json.payload.errors).toMatchObject([
      {
        message: 'Please provide a valid email address in the format example@domain.com',
        field: 'email',
      },
    ])
  })

  test('verification code is required for confirm', async ({ expect }) => {
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/email/change/confirm',
      body: {},
    })

    expect(response.status).toBe(422)

    const json = await response.json()
    expect(json.payload.errors).toMatchObject([
      {
        message: 'Verification code is required',
        field: 'code',
      },
    ])
  })

  test('verification code must be exactly 6 digits', async ({ expect }) => {
    const { user } = await createUser()

    const testCases = [
      { code: '12345', description: 'too short' },
      { code: '1234567', description: 'too long' },
      { code: 'abcdef', description: 'non-numeric' },
      { code: '12345a', description: 'mixed alphanumeric' },
    ]

    for (const testCase of testCases) {
      const response = await makeRequestAsUser(user, {
        method: 'POST',
        path: '/auth/email/change/confirm',
        body: {
          code: testCase.code,
        },
      })

      expect(response.status).toBe(422)

      const json = await response.json()
      expect(json.payload.errors).toMatchObject([
        {
          message: 'Verification code must be exactly 6 digits',
          field: 'code',
        },
      ])
    }
  })
})
