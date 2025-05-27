import type { Broadcast } from '#root/database/database_schema_types.js'
import { Badge, type BadgeProps } from '@kibamail/owly/badge'

export interface BroadcastStatusProps {
  status?: Broadcast['status']
}

export const broadcastStatusNames: Record<
  NonNullable<Broadcast['status']>,
  {
    variant: BadgeProps['variant']
    label: string
  }
> = {
  DRAFT: {
    variant: 'neutral',
    label: 'Draft',
  },
  SENT: {
    variant: 'success',
    label: 'Sent',
  },
  SENDING_FAILED: {
    variant: 'error',
    label: 'Sending failed',
  },
  SENDING: {
    variant: 'info',
    label: 'Sending',
  },
  QUEUED_FOR_SENDING: {
    variant: 'info',
    label: 'Queued for sending',
  },
  ARCHIVED: {
    variant: 'neutral',
    label: 'Archived',
  },
  DRAFT_ARCHIVED: {
    variant: 'neutral',
    label: 'Draft archived',
  },
}

export function isSendingStatus(status: Broadcast['status']) {
  const sentStatus: Broadcast['status'][] = ['SENT', 'SENDING_FAILED', 'SENDING']

  return sentStatus.includes(status)
}

export function BroadcastStatus({ status }: BroadcastStatusProps) {
  if (!status) {
    return null
  }

  return (
    <Badge variant={broadcastStatusNames[status].variant}>
      {broadcastStatusNames[status].label}
    </Badge>
  )
}
