import { IgnitorDev } from "@/app/ignitor/ignitor_dev.js"
import { addDefaultChannelsCommand } from "@/cli/commands/chat/add_default_channels_comand.js"
import { seedDevSendingSourcesCommand } from "@/cli/commands/seed_dev_sending_sources_command.js"
import { faker } from "@faker-js/faker"
import { FullConfig, chromium } from "@playwright/test"
import { DateTime } from "luxon"
import { resolve } from "path"

import { TeamMembershipRepository } from "@/teams/repositories/team_membership_repository.js"
import { TeamRepository } from "@/teams/repositories/team_repository.js"

import { RegisterUserAction } from "@/auth/actions/register_user_action.js"
import { UserRepository } from "@/auth/users/repositories/user_repository.js"

import { basePath } from "@/tests/e2e/helpers/storage_state_paths.js"
import { refreshDatabase } from "@/tests/mocks/teams/teams.js"

import { Team, type TeamMembership } from "@/database/database_schema_types.js"

import { route } from "@/shared/routes/route_aliases.js"

import { container } from "@/utils/typi.js"

async function createUser({
  addtoTeam,
}: {
  addtoTeam?: { teamId: string; role: TeamMembership["role"] }
}) {
  const userDetails = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email:
      faker.number.bigInt({ min: 101, max: 999 }) +
      "-" +
      faker.internet.email({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
      }),
    password: "password",
  }

  const { user } = await container.make(RegisterUserAction).handle(userDetails)

  await container.make(UserRepository).update(user.id, {
    emailVerifiedAt: DateTime.now().toJSDate(),
  })

  await container.make(UserRepository).update(user.id, {
    password: userDetails.password,
  })

  let team: Partial<Team> = await container.make(TeamRepository).create(
    {
      name: faker.company.buzzAdjective(),
    },
    user.id,
  )

  if (addtoTeam) {
    await container.make(TeamMembershipRepository).create({
      role: addtoTeam.role,
      teamId: addtoTeam.teamId,
      userId: user.id,
      expiresAt: DateTime.now().toJSDate(),
      email: userDetails.email,
      status: "ACTIVE",
    })
  }

  return { user: { ...user, ...userDetails }, team }
}

export default async function globalSetup(config: FullConfig) {
  function browserRoute(path: string) {
    return `${config?.projects?.[0]?.use?.baseURL}${path.startsWith("/") ? path : `/${path}`}`
  }

  const ignitor = new IgnitorDev().boot()

  // mock google and github drivers.

  await ignitor.start()

  await refreshDatabase()

  await Promise.all([
    addDefaultChannelsCommand.handler?.(),
    seedDevSendingSourcesCommand.handler?.(),
  ])

  const teamMemberOwner = await createUser({})

  const teamMemberGuest = await createUser({
    addtoTeam: { teamId: teamMemberOwner?.team?.id as string, role: "GUEST" },
  })
  const teamMemberAuthor = await createUser({
    addtoTeam: { teamId: teamMemberOwner?.team?.id as string, role: "AUTHOR" },
  })

  const teamMemberManager = await createUser({
    addtoTeam: { teamId: teamMemberOwner?.team?.id as string, role: "MANAGER" },
  })

  const teamMemberAdministrator = await createUser({
    addtoTeam: { teamId: teamMemberOwner?.team?.id as string, role: "ADMINISTRATOR" },
  })

  const users = [
    { name: "owner", user: teamMemberOwner },
    { name: "guest", user: teamMemberGuest },
    { name: "author", user: teamMemberAuthor },
    { name: "manager", user: teamMemberManager },
    { name: "administrator", user: teamMemberAdministrator },
  ]

  const browser = await chromium.launch()

  for (const {
    user: { user },
    name,
  } of users) {
    const page = await browser.newPage()

    await page.goto(browserRoute(route("auth_login")))

    await page.getByLabel("Email address").fill(user.email)
    await page.getByLabel("Password", { exact: true }).fill(user.password)

    await page.getByText("Continue", { exact: true }).click()

    await page.waitForTimeout(1000)

    await page.waitForURL(browserRoute(route("dashboard")), { timeout: 5000 })

    if (name !== "owner") {
      // make all users switch to the owner's team, so they are all on the team we will focus our testing on.

      const openTeamSwitcherDropdown = page.getByTestId(
        "offscreen-sidebar-dropdown-menu-trigger",
      )

      await openTeamSwitcherDropdown.click()

      const switchTeamLink = page.getByTestId(
        `offscreen-sidebar-switch-team-id-${teamMemberOwner?.team?.id}`,
      )

      await switchTeamLink.click()

      await page.waitForURL(browserRoute(route("dashboard")), { timeout: 5000 })
    }

    await page.context().storageState({ path: resolve(basePath, `auth.${name}.json`) })

    await page.close()
  }
  await browser.close()
}
