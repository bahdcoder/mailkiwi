import { expect, test } from '#root/core/tests/e2e/fixtures/users.js'

import { route } from '#root/core/shared/routes/route_aliases.js'

test('can switch teams', async ({ managerPage, seed }) => {
  await managerPage.page.goto(route('dashboard'))

  const waitForSwitchTeamRequestPromise = managerPage.page.waitForRequest(
    (request) => request.url().includes('switch') && request.method() === 'GET',
  )

  await managerPage.switchToTeam(seed.owner.team.id)

  const request = await waitForSwitchTeamRequestPromise

  expect(request.url()).toContain(seed.owner.team.id)

  const activeTeamName = await managerPage.teamSwitchDropdownMenuTrigger.textContent()

  expect(activeTeamName?.toLowerCase()).toContain(seed.owner.team.name.toLowerCase())
})
