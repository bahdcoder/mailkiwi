import "./styles.css"
import { MailOpenIcon } from "@/pages/components/icons/mail-open.svg.jsx"
import { MailOutIcon } from "@/pages/components/icons/mail-out.svg.jsx"
import { MoreVertIcon } from "@/pages/components/icons/more-vert.svg.jsx"
import { OneFingerSelectHandGestureIcon } from "@/pages/components/icons/one-finger-select-hand-gesture.svg.jsx"
import { SearchIcon } from "@/pages/components/icons/search.svg.jsx"
import { Badge } from "@kibamail/owly/badge"
import { Button } from "@kibamail/owly/button"
import { Heading } from "@kibamail/owly/heading"
import * as Tabs from "@kibamail/owly/tabs"
import { Text } from "@kibamail/owly/text"
import * as TextField from "@kibamail/owly/text-field"
import * as React from "react"
import { toast } from "sonner"
import { usePageContext } from "vike-react/usePageContext"

import {
  BroadcastGroup,
  BroadcastGroupWithBroadcasts,
} from "@/database/database_schema_types.js"

import { route } from "@/shared/routes/route_aliases.js"

enum BroadcastStatus {
  DRAFT = "draft",
  SENT = "sent",
  SCHEDULED = "scheduled",
  ALL = "all",
}

export type EngagePageProps = {
  groups: BroadcastGroupWithBroadcasts[]
}

function EngagePage() {
  const ctx = usePageContext()

  const defaultTabValue = ctx.urlParsed?.search?.status ?? BroadcastStatus.ALL

  const { groups } = ctx.pageProps as EngagePageProps

  return (
    <Tabs.Content value="broadcasts" className="pt-6">
      <Tabs.Root variant="primary" defaultValue={defaultTabValue} width={"full"}>
        <div className="w-full flex flex-col gap-y-2 lg:gap-y-0 lg:flex-row items-center lg:justify-between">
          <div className="w-full lg:max-w-72">
            <TextField.Root
              type="search"
              placeholder="Search broadcasts"
              className="w-search-broadcasts"
            >
              <TextField.Slot side="left">
                <SearchIcon />
              </TextField.Slot>
            </TextField.Root>
          </div>

          <div className="w-full lg:w-auto">
            <Tabs.List className="lg:w-[fit-content]">
              <Tabs.Trigger value={BroadcastStatus.ALL} asChild>
                <a href={route("engage")}>All</a>
              </Tabs.Trigger>
              <Tabs.Trigger value={BroadcastStatus.SENT} asChild>
                <a href={route("engage", {}, { status: "sent" })}>Sent</a>
              </Tabs.Trigger>
              <Tabs.Trigger value={BroadcastStatus.SCHEDULED} asChild>
                <a href={route("engage", {}, { status: "scheduled" })}>Scheduled</a>
              </Tabs.Trigger>
              <Tabs.Trigger value={BroadcastStatus.DRAFT} asChild>
                <a href={route("engage", {}, { status: "draft" })}>Drafts</a>
              </Tabs.Trigger>
              <Tabs.Indicator />
            </Tabs.List>
          </div>
        </div>

        <div
          className="w-full max-w-[calc(100vw-var(--w-sidebar-width)-64px)] pt-4 flex flex-col gap-8 pb-32"
          data-orientation="horizontal"
          role="tabpanel"
        >
          {groups.map((group) => (
            <div key={group.id} className="">
              <Heading
                size="sm"
                className="px-2 font-display kb-content-brand capitalize"
              >
                {group?.name}
              </Heading>
              <div className="flex flex-col">
                {group?.broadcasts?.map((broadcast) => (
                  <a
                    key={broadcast.id}
                    href={
                      broadcast?.status === "SENT"
                        ? route("engage_overview", { uuid: broadcast.id })
                        : route("broadcasts_composer", { uuid: broadcast.id })
                    }
                    className="h-[4.5rem] hidden lg:flex w-full py-4 px-2 box-border border-b border-[var(--black-5)] ease-in-out duration-300 transition-[background-color] hover:bg-[var(--background-hover)] cursor-pointer"
                  >
                    <div className="w-full max-w-[40%] flex flex-col">
                      <Text className="kb-content-secondary font-medium">
                        {broadcast.name}
                      </Text>
                      <Text className="kb-content-tertiary truncate overflow-ellipsis">
                        {broadcast?.name}
                      </Text>
                    </div>

                    <div className="w-full max-w-[18%] flex justify-center items-center">
                      <Badge variant="success" size="sm">
                        Sent
                      </Badge>
                    </div>

                    <div className="w-full max-w-[10%] flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <Text className="kb-content-tertiary">
                          <MailOutIcon className="w-5 h-5 kb-content-disabled" />
                        </Text>
                        <Text className="kb-content-tertiary">4,827</Text>
                      </div>
                    </div>
                    <div className="w-full max-w-[10%] flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <Text className="kb-content-tertiary">
                          <MailOpenIcon className="w-5 h-5 kb-content-disabled" />
                        </Text>
                        <Text className="kb-content-tertiary">63%</Text>
                      </div>
                    </div>
                    <div className="w-full max-w-[10%] flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <Text className="kb-content-tertiary">
                          <OneFingerSelectHandGestureIcon className="w-5 h-5 kb-content-disabled" />
                        </Text>
                        <Text className="kb-content-tertiary">63%</Text>
                      </div>
                    </div>
                    <div className="w-full max-w-[10%] flex items-center justify-end">
                      <Text className="kb-content-tertiary truncate overflow-ellipsis">
                        Edited 23 mins ago
                      </Text>
                    </div>
                    <div className="w-full max-w-[2%] flex items-center">
                      <Button
                        variant="tertiary"
                        onClick={(event) => [
                          event.stopPropagation(),
                          event.preventDefault(),
                        ]}
                      >
                        <MoreVertIcon className="w-5 h-5" />
                      </Button>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Tabs.Root>
    </Tabs.Content>
  )
}

export { EngagePage as Page }
