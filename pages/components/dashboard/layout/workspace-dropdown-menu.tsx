import { useApplicationLayoutContext } from "@/pages/components/dashboard/layout/application-layout-context.jsx"
import { DEFAULT_SIDEBAR_WIDTH } from "@/pages/components/dashboard/layout/sidebar/left-sidebar.jsx"
import { SignoutForm } from "@/pages/components/dashboard/layout/signout-form.jsx"
import { CheckIcon } from "@/pages/components/icons/check.svg.jsx"
import { NavArrowDownIcon } from "@/pages/components/icons/nav-arrow-down.svg.jsx"
import { PlusIcon } from "@/pages/components/icons/plus.svg.jsx"
import { SettingsIcon } from "@/pages/components/icons/settings.svg.jsx"
import { UserPlusIcon } from "@/pages/components/icons/user-plus.svg.jsx"
import { UserIcon } from "@/pages/components/icons/user.svg.jsx"
import { Text } from "@kibamail/owly/text"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import React from "react"
import { usePageContext } from "vike-react/usePageContext"

interface WorkspacesDropdownMenuProps {
  rootId: string
}

export function WorkspacesDropdownMenu({ rootId }: WorkspacesDropdownMenuProps) {
  const ctx = usePageContext()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          id={`${rootId}-dropdown-menu-trigger`}
          className="flex-grow flex items-center border transition ease-in-out border-transparent hover:bg-[var(--background-hover)] focus:outline-none focus-within:border-[var(--border-focus)] p-1 rounded-lg"
        >
          <span className="flex-grow flex items-center">
            <span className="w-6 h-6 mr-1.5 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.10)_inset] kb-background-info rounded-lg flex items-center justify-center kb-content-primary-inverse">
              {ctx?.team?.name?.slice(0, 1)?.[0]}
            </span>

            <Text className="kb-content-primary truncate">{ctx?.team?.name}</Text>
          </span>

          <NavArrowDownIcon
            aria-hidden
            className="ml-1 w-4 h-4 kb-content-tertiary-inverse"
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        sideOffset={8}
        align="start"
        id={`${rootId}-dropdown-menu-content`}
        className="border workspaces-dropdown-menu kb-border-tertiary absolute rounded-xl p-1 shadow-[0px_16px_24px_-8px_var(--black-10)] kb-background-primary w-[17.5rem] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
      >
        <DropdownMenu.CheckboxItem
          checked={false}
          className="p-2 flex items-center hover:bg-[var(--background-secondary)] rounded-lg cursor-pointer"
        >
          <span className="w-5 h-5 mr-1.5 text-sm shadow-[0px_0px_0px_1px_rgba(0,0,0,0.10)_inset] kb-background-info rounded-lg flex items-center justify-center kb-content-primary-inverse">
            A
          </span>
          <Text className="kb-content-secondary">Abolaji Design Studio</Text>
        </DropdownMenu.CheckboxItem>
        <DropdownMenu.CheckboxItem
          checked={true}
          className="p-2 flex items-center hover:bg-[var(--background-secondary)] rounded-lg cursor-pointer"
        >
          <span className="w-5 h-5 mr-1.5 text-sm shadow-[0px_0px_0px_1px_rgba(0,0,0,0.10)_inset] kb-background-positive rounded-lg flex items-center justify-center kb-content-primary-inverse">
            Z
          </span>
          <Text className="kb-content-secondary">Zibaletter</Text>

          <DropdownMenu.ItemIndicator className="ml-auto">
            <CheckIcon className="w-5 h-5 kb-content-secondary" />
          </DropdownMenu.ItemIndicator>
        </DropdownMenu.CheckboxItem>

        <DropdownMenu.Item className="p-2 flex items-center hover:bg-[var(--background-secondary)] rounded-lg cursor-pointer">
          <PlusIcon className="mr-1.5 w-5 h-5 kb-content-tertiary" />
          <Text>New workspace</Text>
        </DropdownMenu.Item>

        <DropdownMenu.Separator className="my-1 h-px bg-[var(--black-5)]" />

        <DropdownMenu.Item className="p-2 flex items-center hover:bg-[var(--background-secondary)] rounded-lg cursor-pointer">
          <UserPlusIcon className="mr-1.5 w-5 h-5 kb-content-tertiary" />
          <Text>Invite member</Text>
        </DropdownMenu.Item>

        <DropdownMenu.Separator className="my-1 h-px bg-[var(--black-5)]" />

        <DropdownMenu.Item className="p-2 flex items-center hover:bg-[var(--background-secondary)] rounded-lg cursor-pointer">
          <SettingsIcon className="mr-1.5 w-5 h-5 kb-content-tertiary" />
          <Text>Workspace settings</Text>
        </DropdownMenu.Item>

        <DropdownMenu.Item className="p-2 flex items-center hover:bg-[var(--background-secondary)] rounded-lg cursor-pointer">
          <UserIcon className="mr-1.5 w-5 h-5 kb-content-tertiary" />
          <Text>Account settings</Text>
        </DropdownMenu.Item>

        <DropdownMenu.Separator className="my-1 h-px bg-[var(--black-5)]" />

        <SignoutForm />
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
