import type { Page } from '@playwright/test'

export class BaseRolePage {
  // offscreen-sidebar-dropdown-menu-trigger
  public readonly teamSwitchDropdownMenuTrigger = this.page.getByTestId(
    'offscreen-sidebar-dropdown-menu-trigger',
  )

  public getTeamLink(teamId: string) {
    return this.page.getByTestId(`offscreen-sidebar-switch-team-id-${teamId}`)
  }

  constructor(public readonly page: Page) {}

  async switchToTeam(teamId: string) {
    await this.teamSwitchDropdownMenuTrigger.click()

    await this.getTeamLink(teamId).click()
  }
}
