import { BookStackIcon } from "@/components/icons/book-stack.svg.jsx"
import { ChatBubbleEmptyIcon } from "@/components/icons/chat-bubble-empty.svg.jsx"
import { HelpCircleIcon } from "@/components/icons/help-circle.svg.jsx"
import { HomeAltSlimHorizIcon } from "@/components/icons/home-alt-slim-horiz.jsx"
import { NavArrowDownIcon } from "@/components/icons/nav-arrow-down.svg.jsx"
import { EngageIcon } from "@/components/icons/products/engage.svg.jsx"
import { InsightsIcon } from "@/components/icons/products/insights.svg.jsx"
import { LettersIcon } from "@/components/icons/products/letters.svg.jsx"
import { OptimiseIcon } from "@/components/icons/products/optimise.svg.jsx"
import { SendIcon } from "@/components/icons/products/send.svg.jsx"
import { SearchIcon } from "@/components/icons/search.svg.jsx"
import { SettingsIcon } from "@/components/icons/settings.svg.jsx"
import { SidebarCollapseIcon } from "@/components/icons/sidebar-collapse.svg.jsx"
import { Button } from "@kibamail/owly/button"
import { Progress } from "@kibamail/owly/progress"
import { Text } from "@kibamail/owly/text"
import cn from "classnames"
import React from "react"
import { usePageContext } from "vike-react/usePageContext"

import { route } from "@/shared/routes/route_aliases.js"

interface ApplicationLayoutProps extends React.PropsWithChildren {}

function ApplicationLayout({ children }: ApplicationLayoutProps) {
  const ctx = usePageContext()

  return (
    <div className="w-full h-screen kb-background-secondary flex">
      <div className="w-full max-w-[16.25rem] flex flex-col p-2">
        <div className="flex-grow w-full">
          <div className="py-2 px-1 flex items-center gap-x-2">
            <button className="flex-grow flex items-center hover:bg-[var(--background-hover)] p-1 rounded-lg">
              <span className="flex-grow flex items-center">
                <span className="w-6 h-6 mr-1.5 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.10)_inset] kb-background-info rounded-lg flex items-center justify-center kb-content-primary-inverse">
                  {ctx?.team?.name?.slice(0, 1)?.[0]}
                </span>

                <Text className="kb-content-primary">{ctx?.team?.name} workspace</Text>
              </span>

              <NavArrowDownIcon className="ml-1 w-4 h-4 kb-content-tertiary-inverse" />
            </button>

            <button aria-label="Collapse sidebar" className="kb-reset">
              <SidebarCollapseIcon className="kb-content-tertiary-inverse" />
            </button>
          </div>

          <div className="my-3">
            <button className="w-full p-2 flex items-center border kb-border-tertiary kb-content-tertiary rounded-lg hover:bg-[var(--background-secondary)] active:bg-[var(--background-hover)] transition-[background] ease-in-out">
              <SearchIcon className="w-5 h-5 mr-1.5" />

              <Text className="kb-content-tertiary flex-grow text-left">Search...</Text>

              <span className="flex items-center ml-1.5 gap-x-0.5">
                <span className="w-5 text-xs h-5 rounded-lg flex items-center justify-center border kb-border-tertiary kb-content-tertiary">
                  ⌘
                </span>
                <span className="w-5 text-xs h-5 rounded-lg flex items-center justify-center border kb-border-tertiary kb-content-tertiary">
                  k
                </span>
              </span>
            </button>
          </div>

          <div className="flex flex-col">
            <SubmenuItemLink href={route("welcome")}>
              <BookStackIcon className="w-5 h-5" />
              <Text className="kb-content-secondary font-medium">Get Started</Text>
            </SubmenuItemLink>

            <SubmenuItemLink href={route("dashboard")}>
              <HomeAltSlimHorizIcon className="w-5 h-5" />
              <Text className="kb-content-secondary font-medium">Dashboard</Text>
            </SubmenuItemLink>

            <SubmenuItemLink href={route("community")}>
              <ChatBubbleEmptyIcon className="w-5 h-5" />
              <Text className="kb-content-secondary font-medium">Chat</Text>

              {/* TODO: Change border color here to use semantic color: kb-border-negative. Would require updating owly package.*/}
              <span
                className="w-6 h-5 kb-background-negative kb-content-primary-inverse flex items-center justify-center text-sm font-sans ml-auto rounded-full border border-[var(--red-200)]
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
            <SubmenuItemLink href={route("letters")}>
              <LettersIcon className="w-5 h-5" />
              <Text className="kb-content-secondary font-medium">Letters</Text>
            </SubmenuItemLink>

            <SubmenuItemLink href={route("send")}>
              <SendIcon className="w-5 h-5" />
              <Text className="kb-content-secondary font-medium">Send</Text>
            </SubmenuItemLink>

            <SubmenuItemLink href={route("engage")}>
              <EngageIcon className="w-5 h-5" />
              <Text className="kb-content-secondary font-medium">Engage</Text>
            </SubmenuItemLink>

            <SubmenuItemLink href={route("optimise")}>
              <OptimiseIcon className="w-5 h-5" />
              <Text className="kb-content-secondary font-medium">Optimise</Text>
            </SubmenuItemLink>

            <SubmenuItemLink href={route("insights")}>
              <InsightsIcon className="w-5 h-5" />
              <Text className="kb-content-secondary font-medium">Insights</Text>
            </SubmenuItemLink>
          </div>
        </div>

        <div className="justify-end px-2 py-2 flex flex-col gap-y-2">
          <div className="flex items-center justify-between">
            <Text className="kb-content-secondary flex items-center">
              Email count <HelpCircleIcon className="ml-1 kb-content-tertiary w-4 h-4" />
            </Text>

            <span className="flex items-center">
              <Text className="kb-content-secondary">173</Text>
              <Text className="kb-content-tertiary font-normal">/6,178 left</Text>
            </span>
          </div>

          <Progress value={12} className="flex-shrink-0" />

          <Text className="kb-content-tertiary">6,178 free emails / month</Text>

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
          >
            <line y1="0.5" x2={228} y2="0.5" stroke="#E0DCD9" strokeDasharray="4 4" />
          </svg>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button className="underline kb-content-tertiary kb-reset">
                <Text className="kb-content-tertiary underline">Give feedback</Text>
              </button>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={2}
                height={2}
                viewBox="0 0 2 2"
                fill="none"
                className="mx-2"
              >
                <circle cx={1} cy={1} r={1} fill="#716D6A" />
              </svg>

              <a href="/docs">
                <Text className="kb-content-tertiary underline">Docs</Text>
              </a>
            </div>

            <a href="/w/settings">
              <SettingsIcon className="w-5 h-5 kb-content-tertiary" />
            </a>
          </div>
        </div>
      </div>
      <div className="w-full py-2 pr-2 flex">
        <DraggableSidebarResizer />
        <div className="w-full w-layout-container h-[calc(100vh-1rem)] rounded-lg border kb-border-tertiary overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

function DraggableSidebarResizer() {
  return (
    <div className="h-[calc(100vh-2.5rem)] cursor-col-resize rounded-t-xl rounded-b-xl my-auto ease-in-out transition-[background] w-1 hover:bg-[var(--border-focus)]"></div>
  )
}

interface SubmenuItemLinkProps
  extends React.PropsWithChildren,
    React.ComponentPropsWithoutRef<"a"> {}

function SubmenuItemLink({ children, ...linkProps }: SubmenuItemLinkProps) {
  const ctx = usePageContext()

  const isActive = ctx.urlOriginal.includes(linkProps.href as string)

  return (
    <a
      data-active={isActive}
      className={cn(
        "w-full p-2 border-t border-l border-r border-b-2 rounded-lg gap-x-2 flex items-center  transition-[background] ease-in-out group",
        {
          "bg-[var(--background-primary)] kb-border-tertiary shadow-[0px_1px_0px_0px_var(--black-5)] kb-content-primary [&>span]:text-[var(--content-primary)] [&>svg]:text-[var(--content-primary)]":
            isActive,
          "hover:bg-[var(--background-hover)] border-transparent kb-content-secondary":
            !isActive,
        },
      )}
      {...linkProps}
    >
      {children}
    </a>
  )
}

export { ApplicationLayout as Layout }
