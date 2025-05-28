import { useApplicationLayoutContext } from '#root/pages/components/dashboard/layout/application-layout-context.jsx'
import { SubmenuItemLink } from '#root/pages/components/dashboard/layout/submenu-item-link.jsx'
import { BookStackIcon } from '#root/pages/components/icons/book-stack.svg.jsx'
import { SidebarCollapseIcon } from '#root/pages/components/icons/sidebar-collapse.svg.jsx'
import { route } from '#root/core/shared/routes/route_aliases.js'
import { Text } from '@kibamail/owly/text'
import { usePageContext } from 'vike-react/usePageContext'
import { GroupIcon } from '#root/pages/components/icons/group.svg.jsx'
import ChatLinesIcon from '#root/pages/components/icons/chat-lines.svg.jsx'
import { ArrowLeftIcon } from '#root/pages/components/icons/arrow-left.svg.jsx'
import { UserIcon } from '#root/pages/components/icons/user.svg.jsx'
import { LockIcon } from '#root/pages/components/icons/lock.svg.jsx'
import { CardSheildIcon } from '#root/pages/components/icons/card-sheild.svg.jsx'
import { KeyMinusIcon } from '#root/pages/components/icons/key-minus.svg.jsx'

interface SidebarContentProps {
  rootId: string
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

  return (
    <>
      <div id={`${rootId}-content`} className="grow w-full">
        <div className="py-2 px-1 flex items-center justify-between w-full">
          <div className="flex gap-2 items-center mt-5">
            <a href={route('dashboard')}>
              <ArrowLeftIcon className="w-4 h-4 kb-content-tetiary" />
            </a>
            <Text size="lg" className="kb-content-secondary text-[2rem]">
              Settings
            </Text>
          </div>

          <button
            aria-label="Collapse sidebar"
            className="kb-reset block md:hidden"
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
            <UserIcon className="w-5 h-5 kb-content-tetiary" />
            <Text className="kb-content-secondary font-medium">Profile</Text>
          </SubmenuItemLink>

          <SubmenuItemLink href={route('settings_notifications')}>
            <ChatLinesIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">Notifications</Text>
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
            <BookStackIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">Workspace</Text>
          </SubmenuItemLink>

          <SubmenuItemLink href={route('settings_domains')}>
            <LockIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">Domains</Text>
          </SubmenuItemLink>

          <SubmenuItemLink href={route('settings_members')}>
            <GroupIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">Members</Text>
          </SubmenuItemLink>

          <SubmenuItemLink href={route('settings_apikeys')}>
            <KeyMinusIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">API Keys management</Text>
          </SubmenuItemLink>
          <SubmenuItemLink href={route('settings_billing')}>
            <CardSheildIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">Billing</Text>
          </SubmenuItemLink>
        </div>
      </div>
    </>
  )
}
