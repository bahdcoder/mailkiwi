import { useApplicationLayoutContext } from '#root/pages/components/dashboard/layout/application-layout-context.jsx'
import { FooterMenuItems } from '#root/pages/components/dashboard/layout/footer-menu-items.jsx'
import { SearchBoxTrigger } from '#root/pages/components/dashboard/layout/sidebar/search-box-trigger.jsx'
import { SubmenuItemLink } from '#root/pages/components/dashboard/layout/submenu-item-link.jsx'
import { WorkspacesDropdownMenu } from '#root/pages/components/dashboard/layout/workspace-dropdown-menu.jsx'
import { BookStackIcon } from '#root/pages/components/icons/book-stack.svg.jsx'
import { ChatBubbleEmptyIcon } from '#root/pages/components/icons/chat-bubble-empty.svg.jsx'
import { HelpCircleIcon } from '#root/pages/components/icons/help-circle.svg.jsx'
import { HomeAltSlimHorizIcon } from '#root/pages/components/icons/home-alt-slim-horiz.jsx'
import { EngageIcon } from '#root/pages/components/icons/products/engage.svg.jsx'
import { LettersIcon } from '#root/pages/components/icons/products/letters.svg.jsx'
import { OptimiseIcon } from '#root/pages/components/icons/products/optimise.svg.jsx'
import { SendIcon } from '#root/pages/components/icons/products/send.svg.jsx'
import { SidebarCollapseIcon } from '#root/pages/components/icons/sidebar-collapse.svg.jsx'
import { FREE_MONTHLY_CREDITS } from '#root/pages/env.js'
import { formatCount } from '#root/pages/utils/number_formatter.js'
import { route } from '#root/core/shared/routes/route_aliases.js'
import { Button } from '@kibamail/owly/button'
import { Progress, type ProgressProps } from '@kibamail/owly/progress'
import { Text } from '@kibamail/owly/text'
import { usePageContext } from 'vike-react/usePageContext'

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

export function SidebarContent({ rootId }: SidebarContentProps) {
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
        <div className="py-2 px-1 flex items-center gap-x-2">
          <WorkspacesDropdownMenu rootId={rootId} />

          <button
            aria-label="Collapse sidebar"
            className="kb-reset"
            type="button"
            onClick={setSidebarOffscreen}
          >
            <SidebarCollapseIcon className="kb-content-tertiary-inverse" />
          </button>
        </div>

        <div className="my-3">
          <SearchBoxTrigger />
        </div>

        <div className="flex flex-col">
          <SubmenuItemLink href={route('welcome')}>
            <BookStackIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">Get Started</Text>
          </SubmenuItemLink>

          <SubmenuItemLink href={route('dashboard')}>
            <HomeAltSlimHorizIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">Dashboard</Text>
          </SubmenuItemLink>

          <SubmenuItemLink href={route('community')}>
            <ChatBubbleEmptyIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">Chat</Text>

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
              Products
            </Text>
          </span>
        </div>

        <div className="flex flex-col">
          <SubmenuItemLink href={route('engage')}>
            <EngageIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">Engage</Text>
          </SubmenuItemLink>

          <SubmenuItemLink href={route('send')}>
            <SendIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">Send</Text>
          </SubmenuItemLink>

          <SubmenuItemLink href={route('optimise')}>
            <OptimiseIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">Optimise</Text>
          </SubmenuItemLink>

          <SubmenuItemLink href={route('letters')}>
            <LettersIcon className="w-5 h-5" />
            <Text className="kb-content-secondary font-medium">Letters</Text>
          </SubmenuItemLink>
        </div>
      </div>

      <div className="justify-end px-2 py-2 flex flex-col gap-y-2">
        <div className="flex items-center justify-between">
          <Text className="kb-content-secondary flex items-center">
            Email count <HelpCircleIcon className="ml-1 kb-content-tertiary w-4 h-4" />
          </Text>

          <span className="flex items-center">
            <Text className="kb-content-secondary">
              {formatCount(team?.totalConsumedCredits)}
            </Text>
            <Text className="kb-content-tertiary font-normal">
              /{formatCount(team?.totalAvailableCredits)} left
            </Text>
          </span>
        </div>

        <Progress
          value={percentageSpent}
          className="shrink-0"
          variant={getProgressBarVariant(percentageSpent)}
        />

        <Text className="kb-content-tertiary">
          {formatCount(FREE_MONTHLY_CREDITS)} free emails / month
        </Text>

        <Button variant="secondary" width="full" className="mt-1">
          Get more emails
        </Button>

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
