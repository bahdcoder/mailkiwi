import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Ignitor } from '#root/core/app/ignitor/ignitor.js'
import { seedDevSendingSourcesCommand } from '#root/cli/commands/seed_dev_sending_sources_command.js'
import { faker } from '@faker-js/faker'
import type { FullConfig } from '@playwright/test'
import { DateTime } from 'luxon'

import { TeamMembershipRepository } from '#root/core/teams/repositories/team_membership_repository.js'
import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import { RegisterUserAction } from '#root/core/auth/actions/register_user_action.js'
import { UserRepository } from '#root/core/auth/users/repositories/user_repository.js'

import { basePath } from '#root/core/tests/e2e/helpers/storage_state_paths.js'
import { refreshDatabase } from '#root/core/tests/mocks/teams/teams.js'

import type { TeamMembership, User } from '#root/database/database_schema_types.js'

import { container } from '#root/core/utils/typi.js'
import { Session } from '#root/core/shared/sessions/sessions.js'
import type { HonoContext } from '#root/core/shared/server/types.js'

async function createUser({
  addtoTeam,
}: {
  addtoTeam?: { teamId: string; role: TeamMembership['role'] }
}) {
  const userDetails = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: `${faker.number.bigInt({
      min: 101,
      max: 999,
    })}-${faker.internet.email({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    })}`,
    password: 'password',
  }

  const { user } = await container.make(RegisterUserAction).handle(userDetails)

  await container.make(UserRepository).update(user.id, {
    emailVerifiedAt: DateTime.now().toJSDate(),
  })

  await container.make(UserRepository).update(user.id, {
    password: userDetails.password,
  })

  const teamName = faker.company.buzzAdjective()

  const teamRepository = container.make(TeamRepository)

  const team = await teamRepository.findUserDefaultTeam(user.id)

  await teamRepository.teams().update(team.id, {
    name: teamName,
  })

  if (addtoTeam) {
    await container.make(TeamMembershipRepository).create({
      role: addtoTeam.role,
      teamId: addtoTeam.teamId,
      userId: user.id,
      expiresAt: DateTime.now().toJSDate(),
      email: userDetails.email,
      status: 'ACTIVE',
    })
  }

  return {
    user: { ...user, ...userDetails },
    team: { ...team, name: teamName },
  }
}

export default async function globalSetup(config: FullConfig) {
  function browserRoute(path: string) {
    return `${config?.projects?.[0]?.use?.baseURL}${
      path.startsWith('/') ? path : `/${path}`
    }`
  }

  await new Ignitor().boot().start()

  await refreshDatabase()

  await Promise.all([
    seedDevSendingSourcesCommand.handler?.(),
    // other commands here.
  ])

  const teamMemberOwner = await createUser({})

  const teamMemberGuest = await createUser({
    addtoTeam: { teamId: teamMemberOwner?.team?.id as string, role: 'GUEST' },
  })

  const teamMemberAuthor = await createUser({
    addtoTeam: { teamId: teamMemberOwner?.team?.id as string, role: 'AUTHOR' },
  })

  const teamMemberManager = await createUser({
    addtoTeam: { teamId: teamMemberOwner?.team?.id as string, role: 'MANAGER' },
  })

  const teamMemberAdministrator = await createUser({
    addtoTeam: {
      teamId: teamMemberOwner?.team?.id as string,
      role: 'ADMINISTRATOR',
    },
  })

  const users = [
    { name: 'owner', user: teamMemberOwner },
    { name: 'guest', user: teamMemberGuest },
    { name: 'author', user: teamMemberAuthor },
    { name: 'manager', user: teamMemberManager },
    { name: 'administrator', user: teamMemberAdministrator },
  ]

  const usersMap: Record<
    'owner' | 'guest' | 'author' | 'manager' | 'administrator',
    { user: Partial<User>; team: { id?: string } }
  > = {
    guest: teamMemberGuest,
    owner: teamMemberOwner,
    author: teamMemberAuthor,
    manager: teamMemberManager,
    administrator: teamMemberAdministrator,
  }

  for (const {
    user: { user, team },
    name,
  } of users) {
    console.log('[setup-e2e] setting up state for owner:', user?.email)

    let sessionContent = ''

    function header(_name: string, value: string) {
      sessionContent = value?.split(';')?.[0]?.split('session=')?.[1]
    }

    await new Session().createForUser(
      {
        header,
        req: {
          header(name: string) {
            if (name === 'user-agent') {
              return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
            }

            if (name === 'x-forwarded-for') {
              return '160.212.38.149'
            }

            return undefined
          },
        },
      } as unknown as HonoContext,
      {
        userId: user.id,
        currentTeamId: team?.id as string,
      },
    )

    await writeFile(
      resolve(basePath, `auth.${name}.json`),
      JSON.stringify({
        cookies: [
          {
            name: 'session',
            value: sessionContent,
            domain: 'localhost',
            path: '/',
            expires: 2147483647,
            httpOnly: true,
            secure: false,
            sameSite: 'Lax',
          },
        ],
        origins: [],
      }),
    )
  }

  await writeFile(resolve(basePath, 'seed.users.json'), JSON.stringify(usersMap))
}
