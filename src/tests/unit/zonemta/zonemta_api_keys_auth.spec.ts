import path from 'node:path'
import fs from 'node:fs/promises'
import { describe, it, vi } from 'vitest'
import {
  refreshDatabase,
  refreshRedisDatabase,
} from '@/tests/mocks/teams/teams.ts'
import { createUser } from '@/tests/mocks/auth/users.ts'
import { CreateTeamAccessTokenAction } from '@/auth/actions/create_team_access_token.ts'
import { container } from '@/utils/typi.ts'

describe('zonemta/api-keys-auth', () => {
  const zoneMtaAuthApiKeysPlugin = require(
    path.resolve(process.cwd(), 'src/zonemta/plugins/auth-api-keys.js'),
  )

  it('registers smtp:auth hook and calls done properly', ({ expect }) => {
    const app = {
      addHook: vi.fn(),
    }
    const done = vi.fn()

    zoneMtaAuthApiKeysPlugin.init(app, done)

    expect(app.addHook.mock.calls[0][0]).toBe('smtp:auth')
    expect(done).toHaveBeenCalled()
  })

  it.skip('verifies api key authentication for an incoming smtp connection', async ({
    expect,
  }) => {
    await refreshRedisDatabase()
    await refreshDatabase()

    const { team } = await createUser()

    // create api keys for team

    const access = await container
      .make(CreateTeamAccessTokenAction)
      .handle(team.id)

    type CallbackFn = (...args: any[]) => void

    let smtpAuthHook: CallbackFn = () => {}

    const app = {
      addHook(_: string, fn: CallbackFn) {
        smtpAuthHook = fn
      },
      config: {
        interfaces: ['feeder'],
      },
    }
    const done = vi.fn()

    const mockSession = {
      interface: 'feeder',
    }

    const mockAuth = {
      username: team.id,
      password: access.toJSON()?.token,
    }

    zoneMtaAuthApiKeysPlugin.init(app, done)

    // test valid credentials
    const authPassed = await Promise.resolve<any>(
      new Promise((resolve) => {
        smtpAuthHook(mockAuth, mockSession, resolve)
      }),
    )
    expect(authPassed).toBeUndefined()

    // test invalid credentials
    const authFailed = await Promise.resolve<any>(
      new Promise((resolve) => {
        smtpAuthHook(
          { ...mockAuth, password: 'wrong-password' },
          mockSession,
          resolve,
        )
      }),
    )

    expect(authFailed.message).toEqual('API Key authentication failed')
  })
})
