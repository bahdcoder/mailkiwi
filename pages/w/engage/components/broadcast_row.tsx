import type { BroadcastWithEmailContent } from '@/database/database_schema_types.js'
import { MailOpenIcon } from '@/pages/components/icons/mail-open.svg.jsx'
import { MailOutIcon } from '@/pages/components/icons/mail-out.svg.jsx'
import { MoreVertIcon } from '@/pages/components/icons/more-vert.svg.jsx'
import { OneFingerSelectHandGestureIcon } from '@/pages/components/icons/one-finger-select-hand-gesture.svg.jsx'
import {
  BroadcastStatus,
  isSendingStatus,
} from '@/pages/w/engage/components/broadcast_status.jsx'
import { route } from '@/shared/routes/route_aliases.js'
import { Button } from '@kibamail/owly/button'
import { Text } from '@kibamail/owly/text'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime.js'

dayjs.extend(relativeTime)

export interface BroadcastRowProps {
  broadcast: BroadcastWithEmailContent
}

export function BroadcastRow({ broadcast }: BroadcastRowProps) {
  const broadcastNameIsSubject = broadcast.name === broadcast.emailContent?.subject

  const lastEditedBroadcast = dayjs(broadcast.updatedAt)
  const lastEditedEmailContent = dayjs(broadcast.emailContent.updatedAt)

  const lastEdited = (
    lastEditedBroadcast > lastEditedEmailContent
      ? lastEditedBroadcast
      : lastEditedEmailContent
  ).fromNow()

  const subtitle = broadcastNameIsSubject
    ? broadcast?.emailContent?.previewText
    : broadcast?.emailContent?.subject

  return (
    <a
      key={broadcast.id}
      href={
        isSendingStatus(broadcast.status)
          ? route('engage_overview', { uuid: broadcast.id })
          : route('broadcasts_composer', { uuid: broadcast.id })
      }
      className="h-[4.5rem] hidden lg:flex w-full py-4 px-2 box-border border-b border-[var(--black-5)] ease-in-out duration-300 transition-[background-color] hover:bg-[var(--background-hover)] cursor-pointer"
    >
      <div className="w-full max-w-[40%] flex flex-col">
        <Text className="kb-content-secondary font-medium">{broadcast.name}</Text>
        <Text className="kb-content-tertiary truncate overflow-ellipsis">
          {subtitle ?? 'Add a preview text or subject'}
        </Text>
      </div>

      <div className="w-full max-w-[18%] flex justify-center items-center">
        <BroadcastStatus status={broadcast.status} />
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
          Edited {lastEdited}
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
  )
}
