import { useComposeBroadcastContext } from "@/pages/components/flows/compose_broadcast/state/compose_broadcast_context.jsx"
import { formatContactsCount } from "@/pages/components/flows/compose_broadcast/utils/format_contacts_count.js"
import {
  SCHEDULED_DATE_READABLE_FORMAT,
  formatScheduleDateTime,
  scheduledDateTimeToDayJsInstance,
} from "@/pages/components/flows/compose_broadcast/utils/format_schedule_date.js"
import { CalendarIcon } from "@/pages/components/icons/calendar.svg.jsx"
import { EditPencilIcon } from "@/pages/components/icons/edit-pencil.svg.jsx"
import { GroupIcon } from "@/pages/components/icons/group.svg.jsx"
import { NotesIcon } from "@/pages/components/icons/notes.svg.jsx"
import { usePageProps } from "@/pages/hooks/use_page_props.js"
import { EngageBroadcastsComposerPageProps } from "@/pages/w/engage/broadcasts/@uuid/composer/+Page.jsx"
import { Text } from "@kibamail/owly/text"
import { usePageContext } from "vike-react/usePageContext"

export function BroadcastDetails() {
  const { formState, getBroadcastRecipientsCount } =
    useComposeBroadcastContext("BroadcastDetails")

  const scheduledAt = scheduledDateTimeToDayJsInstance(formState.scheduledAt).format(
    SCHEDULED_DATE_READABLE_FORMAT,
  )

  return (
    <div className="flex flex-col gap-6">
      <dl className="w-full flex gap-4">
        <dt className="w-full max-w-36 flex-shrink-0 flex items-center gap-2">
          <EditPencilIcon className="w-5 h-5 kb-content-disabled" />
          <Text className="kb-content-tertiary">Subject</Text>
        </dt>
        <dd className="w-full flex-grow">
          <Text className="kb-content-secondary">{formState?.subject}</Text>
        </dd>
      </dl>

      <dl className="w-full flex gap-4">
        <dt className="w-full max-w-36 flex-shrink-0 flex items-center gap-2">
          <NotesIcon className="w-5 h-5 kb-content-disabled" />
          <Text className="kb-content-tertiary">Preview text</Text>
        </dt>
        <dd className="w-full flex-grow">
          <Text className="kb-content-secondary">{formState?.previewText}</Text>
        </dd>
      </dl>

      <dl className="w-full flex gap-4">
        <dt className="w-full max-w-36 flex-shrink-0 flex items-center gap-2">
          <GroupIcon className="w-5 h-5 kb-content-disabled" />
          <Text className="kb-content-tertiary">Contacts</Text>
        </dt>
        <dd className="w-full flex-grow flex gap-2">
          <Text className="kb-content-secondary">
            {formatContactsCount(getBroadcastRecipientsCount?.data?.total ?? 0)} contacts
          </Text>
        </dd>
      </dl>

      <dl className="w-full flex gap-4">
        <dt className="w-full max-w-36 flex-shrink-0 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 kb-content-disabled" />
          <Text className="kb-content-tertiary">Scheduled date</Text>
        </dt>
        <dd className="w-full flex-grow">
          <Text className="kb-content-secondary">{scheduledAt ?? "---"}</Text>
        </dd>
      </dl>
    </div>
  )
}
