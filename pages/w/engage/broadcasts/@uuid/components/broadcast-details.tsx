import { useComposeBroadcastContext } from '#root/pages/components/flows/compose_broadcast/state/compose_broadcast_context.jsx'
import {
  SCHEDULED_DATE_READABLE_FORMAT,
  scheduledDateTimeToDayJsInstance,
} from '#root/pages/components/flows/compose_broadcast/utils/format_schedule_date.js'
import { CalendarIcon } from '#root/pages/components/icons/calendar.svg.jsx'
import { EditPencilIcon } from '#root/pages/components/icons/edit-pencil.svg.jsx'
import { GroupIcon } from '#root/pages/components/icons/group.svg.jsx'
import { NotesIcon } from '#root/pages/components/icons/notes.svg.jsx'
import { formatCount } from '#root/pages/utils/number_formatter.js'
import { Text } from '@kibamail/owly/text'

export function BroadcastDetails() {
  const {
    formState,
    getBroadcastRecipientsCount,
    broadcastQuery: { data: broadcast },
  } = useComposeBroadcastContext('BroadcastDetails')

  const scheduledAt = scheduledDateTimeToDayJsInstance(formState.scheduledAt).format(
    SCHEDULED_DATE_READABLE_FORMAT,
  )

  return (
    <div className="flex flex-col gap-6">
      <dl className="w-full flex gap-4">
        <dt className="w-full max-w-36 shrink-0 flex items-center gap-2">
          <EditPencilIcon className="w-5 h-5 kb-content-disabled" />
          <Text className="kb-content-tertiary">Subject</Text>
        </dt>
        <dd className="w-full grow">
          <Text className="kb-content-secondary">
            {broadcast?.emailContent?.subject ?? '---'}
          </Text>
        </dd>
      </dl>

      <dl className="w-full flex gap-4">
        <dt className="w-full max-w-36 shrink-0 flex items-center gap-2">
          <NotesIcon className="w-5 h-5 kb-content-disabled" />
          <Text className="kb-content-tertiary">Preview text</Text>
        </dt>
        <dd className="w-full grow">
          <Text className="kb-content-secondary">
            {broadcast?.emailContent?.previewText ?? '---'}
          </Text>
        </dd>
      </dl>

      <dl className="w-full flex gap-4">
        <dt className="w-full max-w-36 shrink-0 flex items-center gap-2">
          <GroupIcon className="w-5 h-5 kb-content-disabled" />
          <Text className="kb-content-tertiary">Contacts</Text>
        </dt>
        <dd className="w-full grow flex gap-2">
          <Text className="kb-content-secondary">
            {formatCount(getBroadcastRecipientsCount?.data?.total ?? 0)} contacts
          </Text>
        </dd>
      </dl>

      <dl className="w-full flex gap-4">
        <dt className="w-full max-w-36 shrink-0 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 kb-content-disabled" />
          <Text className="kb-content-tertiary">Scheduled date</Text>
        </dt>
        <dd className="w-full grow">
          <Text className="kb-content-secondary">
            {broadcast?.sendAt ? scheduledAt : '---'}
          </Text>
        </dd>
      </dl>
    </div>
  )
}
