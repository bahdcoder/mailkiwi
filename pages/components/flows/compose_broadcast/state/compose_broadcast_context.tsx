import type { useGetBroadcastRecipientsCount } from '#root/pages/components/flows/compose_broadcast/hooks/use_get_broadcast_recipients_count.js'
import type { useValidateBroadcastContentMutation } from '#root/pages/components/flows/compose_broadcast/hooks/use_validate_broadcast_content_mutation.js'
import type { ScheduleDateTime } from '#root/pages/components/flows/compose_broadcast/utils/format_schedule_date.js'
import { createContext } from '@radix-ui/react-context'
import type React from 'react'

import type { BroadcastWithEmailContent } from '#root/database/database_schema_types.js'
import type { useSyncComposerContentToServer } from '#root/pages/components/flows/compose_broadcast/hooks/use_sync_composer_content_to_server.js'
import type { UseQueryResult } from '@tanstack/react-query'

export interface ComposeBroadcastContextInterface {
  syncContentToServerMutation: ReturnType<typeof useSyncComposerContentToServer>
  validateBroadcastEmailContentMutation: ReturnType<
    typeof useValidateBroadcastContentMutation
  >
  broadcastQuery: UseQueryResult<BroadcastWithEmailContent, unknown>
  step: number

  setStep: React.Dispatch<React.SetStateAction<number>>
  getBroadcastRecipientsCount: ReturnType<typeof useGetBroadcastRecipientsCount>
  formState: {
    trackClicks: boolean
    trackOpens: boolean
    segmentId: string
    subject: string
    previewText: string
    senderIdentityId: string
    scheduledAt: ScheduleDateTime
  }
  setFormState: React.Dispatch<
    React.SetStateAction<ComposeBroadcastContextInterface['formState']>
  >
}

export const [ComposeBroadcastProvider, useComposeBroadcastContext] =
  createContext<ComposeBroadcastContextInterface>('ComposeBroadcast')
