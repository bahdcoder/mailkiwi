import { useApplicationLayoutContext } from '#root/pages/components/dashboard/layout/application-layout-context.jsx'
import { FooterMenuItems } from '#root/pages/components/dashboard/layout/footer-menu-items.jsx'
import { SubmenuItemLink } from '#root/pages/components/dashboard/layout/submenu-item-link.jsx'
import { BookStackIcon } from '#root/pages/components/icons/book-stack.svg.jsx'
import { SidebarCollapseIcon } from '#root/pages/components/icons/sidebar-collapse.svg.jsx'
import { route } from '#root/core/shared/routes/route_aliases.js'
import type { ProgressProps } from '@kibamail/owly/progress'
import { Text } from '@kibamail/owly/text'
import { usePageContext } from 'vike-react/usePageContext'
import { ArrowLeft } from 'lucide-react'
import WorkspaceIcon from '../../../icons/workspace.svg.jsx'
import { LinkIcon } from '../../../icons/link.svg.jsx'
import { GroupIcon } from '../../../icons/group.svg.jsx'
import ChatLinesIcon from '../../../icons/chat-lines.svg.jsx'
import ApiKeyCardIcon from '../../../icons/api-key-card.svg.jsx'
import BillingIcon from '../../../icons/billing.svg.jsx'

interface SidebarContentProps {
  rootId: string
}

export function getProgressBarVariant(percentageSpent: number): ProgressProps['variant'] {
  if (percentageSpent > 80) {
    return 'error'
  }

  if (percentageSpent > 50) {
    return 'warning'
  }

  return 'info'
}

export function SidebarSettingsContent({ rootId }: SidebarContentProps) {
  const { isMobile, team } = usePageContext()
  const { setSidebar } = useApplicationLayoutContext('Sidebar')

  function setSidebarOffscreen() {
    if (isMobile) {
      setSidebar((current) => ({ ...current, floating: false }))

      return
    }

    setSidebar((current) => ({ ...current, offscreen: true }))
  }

  const percentageSpent = Math.max(
    (team?.totalConsumedCredits / team?.totalAvailableCredits) * 100,
    2,
  )

  return (
    <>
      <div id={`${rootId}-content`} className="grow w-full">
        <div className="py-2 px-1 flex items-center justify-between w-full">
          <div className="flex gap-2 items-center">
            <ArrowLeft className="w-5 h-5" />
            <Text size="sm" className="kb-content-secondary text-[2rem]">
              Settings
            </Text>
          </div>

          <button
            aria-label="Collapse sidebar"
            className="kb-reset"
            type="button"
            onClick={setSidebarOffscreen}
          >
            <SidebarCollapseIcon className="kb-content-tertiary-inverse" />
          </button>
        </div>

        <div className="mt-4 mb-2.5">
          <span className="px-2 py-1.5">
            <Text size="sm" className="kb-content-secondary uppercase">
              Account
            </Text>
          </span>
        </div>

        <div className="flex flex-col">
          <SubmenuItemLink href={route('settings')}>
            <BookStackIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">Profile</Text>
          </SubmenuItemLink>

          <SubmenuItemLink href={route('settings_notifications')}>
            <ChatLinesIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">Notifications</Text>

            {/* TODO: Change border color here to use semantic color: kb-border-negative. Would require updating owly package.*/}
            <span
              className="w-6 h-5 kb-background-negative kb-content-primary-inverse flex items-center justify-center text-sm font-sans ml-auto rounded-full border border-(--red-200)
              shadow-[0px_2px_0px_0px_var(--white-5)_inset,0px_1px_0px_0px_var(--black-10)]
              "
            >
              3
            </span>
          </SubmenuItemLink>
        </div>

        <div className="mt-4 mb-2.5">
          <span className="px-2 py-1.5">
            <Text size="sm" className="kb-content-secondary uppercase">
              Administration
            </Text>
          </span>
        </div>

        <div className="flex flex-col">
          <SubmenuItemLink href={route('settings_workspace')}>
            <WorkspaceIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">Workspace</Text>
          </SubmenuItemLink>

          <SubmenuItemLink href={route('settings_domains')}>
            <LinkIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">Domains</Text>
          </SubmenuItemLink>

          <SubmenuItemLink href={route('settings_members')}>
            <GroupIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">Members</Text>
          </SubmenuItemLink>

          <SubmenuItemLink href={route('settings_apikeys')}>
            <ApiKeyCardIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">API Keys management</Text>
          </SubmenuItemLink>
          <SubmenuItemLink href={route('settings_billing')}>
            <BillingIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">Billing</Text>
          </SubmenuItemLink>
        </div>
      </div>

      <div className="justify-end px-2 py-2 flex flex-col gap-y-2">
        <svg
          width={228}
          height={1}
          viewBox="0 0 228 1"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="my-4"
          role="img"
          aria-label="divider"
        >
          <line y1="0.5" x2={228} y2="0.5" stroke="#E0DCD9" strokeDasharray="4 4" />
        </svg>

        <div className="flex items-center justify-between">
          <FooterMenuItems />
        </div>
      </div>
    </>
  )
}
