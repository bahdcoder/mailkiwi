import { CalendarIcon } from "@/pages/components/icons/calendar.svg.jsx"
import { EditPencilIcon } from "@/pages/components/icons/edit-pencil.svg.jsx"
import { GroupIcon } from "@/pages/components/icons/group.svg.jsx"
import { NotesIcon } from "@/pages/components/icons/notes.svg.jsx"
import { Text } from "@kibamail/owly/text"

export function BroadcastDetails() {
  return (
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
  )
}
