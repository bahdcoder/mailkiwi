import { sleep } from '#root/core/utils/sleep'
import type { Page } from '@playwright/test'

export class BaseRolePage {
  public readonly teamSwitchDropdownMenuTrigger = this.page.getByTestId(
    'offscreen-sidebar-dropdown-menu-trigger',
  )

  public getTeamLink(teamId: string) {
    return this.page.getByTestId(`offscreen-sidebar-switch-team-id-${teamId}`)
  }

  constructor(public readonly page: Page) {}

  async switchToTeam(teamId: string) {
    await this.teamSwitchDropdownMenuTrigger.focus()

    await this.page.waitForTimeout(1000)
    await this.teamSwitchDropdownMenuTrigger.press('ArrowDown')

    await this.getTeamLink(teamId).click({})
  }
}
