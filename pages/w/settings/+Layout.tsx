import { Heading } from '@kibamail/owly/heading'
import type { PropsWithChildren } from 'react'
import { ArrowLeftIcon } from '#root/pages/components/icons/arrow-left.svg.jsx'
import { route } from '#root/core/shared/routes/route_aliases'
import { Text } from '@kibamail/owly/text'
import { SubmenuItemLink } from '#root/pages/components/dashboard/layout/submenu-item-link.jsx'
import { UserIcon } from '#root/pages/components/icons/user.svg.jsx'
import { LockIcon } from '#root/pages/components/icons/lock.svg.jsx'

function SettingsLayout({ children }: PropsWithChildren) {
  return (
    <div className="w-screen flex items-center h-screen px-2 pb-2 py-2 box-border kb-background-secondary fixed overflow-y-auto top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 focus:outline-none duration-300 ease-out">
      <div className="w-[280px] h-[calc(100vh-1rem)] px-3">
        <a href={route('dashboard')} className="py-4 flex items-center gap-2">
          <ArrowLeftIcon className="w-4 h-4" />
          <Heading size="xs">Settings</Heading>
        </a>

        <div className="mt-4 mb-2.5">
          <span className="py-1.5">
            <Text size="sm" className="kb-content-secondary uppercase">
              Account
            </Text>
          </span>
        </div>

        <div className="flex flex-col">
          <SubmenuItemLink href={route('settings_account')}>
            <UserIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">Account</Text>
          </SubmenuItemLink>
        </div>

        <div className="mt-4 mb-2.5">
          <span className="py-1.5">
            <Text size="sm" className="kb-content-secondary uppercase">
              Workspace
            </Text>
          </span>
        </div>

        <div className="flex flex-col">
          <SubmenuItemLink href={route('settings_api_keys')}>
            <LockIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">API keys</Text>
          </SubmenuItemLink>
        </div>
      </div>

      <div className="flex flex-col flex-grow">
        <div className="flex grow w-full h-[calc(100vh-1rem)] box-border border kb-border-tertiary rounded-xl kb-background-hover">
          {children}
        </div>
      </div>
    </div>
  )
}

export { SettingsLayout as Layout }
