import { CalendarIcon } from "@/pages/components/icons/calendar.svg.jsx"
import { EditPencilIcon } from "@/pages/components/icons/edit-pencil.svg.jsx"
import { GroupIcon } from "@/pages/components/icons/group.svg.jsx"
import { NotesIcon } from "@/pages/components/icons/notes.svg.jsx"
import { MetricCard } from "@/pages/components/performance/metric-card.jsx"
import * as Tabs from "@kibamail/owly/tabs"
import { Text } from "@kibamail/owly/text"
import { usePageContext } from "vike-react/usePageContext"

function LetterOverviewPage() {
  const ctx = usePageContext()

  return (
    <Tabs.Content value="overview" className="pt-6">
      <div className="flex flex-col gap-6">
        <dl className="w-full flex gap-4">
          <dt className="w-full max-w-32 flex-shrink-0 flex items-center gap-2">
            <EditPencilIcon className="w-5 h-5 kb-content-disabled" />
            <Text className="kb-content-tertiary">Subject</Text>
          </dt>
          <dd className="w-full flex-grow">
            <Text className="kb-content-secondary">This is the subject</Text>
          </dd>
        </dl>

        <dl className="w-full flex gap-4">
          <dt className="w-full max-w-32 flex-shrink-0 flex items-center gap-2">
            <NotesIcon className="w-5 h-5 kb-content-disabled" />
            <Text className="kb-content-tertiary">Preview text</Text>
          </dt>
          <dd className="w-full flex-grow">
            <Text className="kb-content-secondary">
              Join over 38,000 contacts and stay updated with our latest news!
            </Text>
          </dd>
        </dl>

        <dl className="w-full flex gap-4">
          <dt className="w-full max-w-32 flex-shrink-0 flex items-center gap-2">
            <GroupIcon className="w-5 h-5 kb-content-disabled" />
            <Text className="kb-content-tertiary">Recipients</Text>
          </dt>
          <dd className="w-full flex-grow flex gap-2">
            <Text className="kb-content-secondary">26,118 contact</Text>
          </dd>
        </dl>

        <dl className="w-full flex gap-4">
          <dt className="w-full max-w-32 flex-shrink-0 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 kb-content-disabled" />
            <Text className="kb-content-tertiary">Delivered date</Text>
          </dt>
          <dd className="w-full flex-grow">
            <Text className="kb-content-secondary">Dec 19, 2024 10:13 AM (GMT +1)</Text>
          </dd>
        </dl>
      </div>

      <div className="w-full mt-9">
        <div className="w-full rounded-2xl flex flex-col lg:flex-row border border-[var(--border-tertiary)] box-border">
          <div className="w-full lg:w-1/4 p-6 border-b lg:border-b-0 lg:border-r box-border border-[var(--border-tertiary)]">
            <MetricCard
              rate={{ label: "Emails delivered", value: "100%" }}
              value={{ label: "Delivery rate", value: "97%" }}
            />
          </div>
          <div className="w-full lg:w-1/4 p-6 border-b lg:border-b-0 lg:border-r box-border border-[var(--border-tertiary)]">
            <MetricCard
              rate={{ label: "Open rate", value: "31.24%" }}
              value={{ label: "Total email opens", value: "1,233" }}
            />
          </div>
          <div className="w-full lg:w-1/4 p-6 border-b lg:border-b-0 lg:border-r box-border border-[var(--border-tertiary)]">
            <MetricCard
              rate={{ label: "Click rate", value: "3.11%" }}
              value={{ label: "Total link clicks", value: "2,103" }}
            />
          </div>
          <div className="w-full lg:w-1/4 box-border p-6">
            <MetricCard
              rate={{ label: "Unsubscribe rate", value: "0.01%" }}
              value={{ label: "Total unsubscribes", value: "302" }}
            />
          </div>
        </div>
      </div>
    </Tabs.Content>
  )
}

export { LetterOverviewPage as Page }
