import "./styles.css"
import { MailOpenIcon } from "@/pages/components/icons/mail-open.svg.jsx"
import { MailOutIcon } from "@/pages/components/icons/mail-out.svg.jsx"
import { MoreVertIcon } from "@/pages/components/icons/more-vert.svg.jsx"
import { OneFingerSelectHandGestureIcon } from "@/pages/components/icons/one-finger-select-hand-gesture.svg.jsx"
import { SearchIcon } from "@/pages/components/icons/search.svg.jsx"
import { Badge } from "@kibamail/owly/badge"
import { Button } from "@kibamail/owly/button"
import * as Tabs from "@kibamail/owly/tabs"
import { Text } from "@kibamail/owly/text"
import * as TextField from "@kibamail/owly/text-field"
import { usePageContext } from "vike-react/usePageContext"

import { route } from "@/shared/routes/route_aliases.js"

enum LetterStatus {
  DRAFT = "draft",
  SENT = "sent",
  SCHEDULED = "scheduled",
  ALL = "all",
}

function LettersPage() {
  const ctx = usePageContext()

  const defaultTabValue = ctx.urlParsed?.search?.status ?? LetterStatus.ALL

  return (
    <Tabs.Content value="letters" className="pt-6">
      <Tabs.Root variant="primary" defaultValue={defaultTabValue} width={"full"}>
        <div className="w-full flex flex-col gap-y-2 lg:gap-y-0 lg:flex-row items-center lg:justify-between">
          <div className="w-full lg:max-w-72">
            <TextField.Root
              type="search"
              placeholder="Search letters"
              className="w-search-letters"
            >
              <TextField.Slot side="left">
                <SearchIcon />
              </TextField.Slot>
            </TextField.Root>
          </div>

          <div className="w-full">
            <Tabs.List className="lg:w-[fit-content]">
              <Tabs.Trigger value={LetterStatus.ALL} asChild>
                <a href={route("letters")}>All</a>
              </Tabs.Trigger>
              <Tabs.Trigger value={LetterStatus.SENT} asChild>
                <a href={route("letters", {}, { status: "sent" })}>Sent</a>
              </Tabs.Trigger>
              <Tabs.Trigger value={LetterStatus.SCHEDULED} asChild>
                <a href={route("letters", {}, { status: "scheduled" })}>Scheduled</a>
              </Tabs.Trigger>
              <Tabs.Trigger value={LetterStatus.DRAFT} asChild>
                <a href={route("letters", {}, { status: "draft" })}>Drafts</a>
              </Tabs.Trigger>
              <Tabs.Indicator />
            </Tabs.List>
          </div>
        </div>

        <div className="w-full pt-4" data-orientation="horizontal" role="tabpanel">
          {[1, 2, 3, 4].map((i) => (
            <a
              key={i}
              href={route("letters_overview", { uuid: i.toString() })}
              className="h-[4.5rem] hidden lg:flex w-full py-4 px-2 box-border border-b border-[var(--black-5)] ease-in-out duration-300 transition-[background-color] hover:bg-[var(--background-hover)] cursor-pointer"
            >
              <div className="w-full max-w-[40%] flex flex-col">
                <Text className="kb-content-secondary font-medium">
                  Welcome to 2025. Software engineering is cooked.
                </Text>
                <Text className="kb-content-tertiary truncate overflow-ellipsis">
                  Stay updated with our latest news and insights! Discover tips, trends,
                  and exclusive offers that can help you thrive in your endeavors.
                </Text>
              </div>

              <div className="w-full max-w-[24%] flex justify-center">
                <Badge variant="success">Sent</Badge>
              </div>

              <div className="w-full max-w-[8%] flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Text className="kb-content-tertiary">
                    <MailOutIcon className="w-5 h-5 kb-content-disabled" />
                  </Text>
                  <Text className="kb-content-tertiary">4,827</Text>
                </div>
              </div>
              <div className="w-full max-w-[8%] flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Text className="kb-content-tertiary">
                    <MailOpenIcon className="w-5 h-5 kb-content-disabled" />
                  </Text>
                  <Text className="kb-content-tertiary">63%</Text>
                </div>
              </div>
              <div className="w-full max-w-[8%] flex items-center justify-center">
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
                  onClick={(event) => [event.stopPropagation(), event.preventDefault()]}
                >
                  <MoreVertIcon className="w-5 h-5" />
                </Button>
              </div>
            </a>
          ))}
        </div>
      </Tabs.Root>
    </Tabs.Content>
  )
}

export { LettersPage as Page }
