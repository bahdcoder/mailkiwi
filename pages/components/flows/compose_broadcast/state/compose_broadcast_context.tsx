import { useGetBroadcastRecipientsCount } from "@/pages/components/flows/compose_broadcast/hooks/use_get_broadcast_recipients_count.js"
import { useValidateBroadcastContentMutation } from "@/pages/components/flows/compose_broadcast/hooks/use_validate_broadcast_content_mutation.js"
import { createContext } from "@radix-ui/react-context"
import { UseMutationResult } from "@tanstack/react-query"
import React from "react"

import type { UpdateBroadcastDto } from "@/broadcasts/dto/update_broadcast_dto.js"

export interface ComposeBroadcastContextInterface {
  syncContentToServerMutation: UseMutationResult<
    void,
    any,
    Partial<UpdateBroadcastDto>,
    any
  >
  validateBroadcastEmailContentMutation: ReturnType<
    typeof useValidateBroadcastContentMutation
  >
  step: number
  setStep: React.Dispatch<React.SetStateAction<number>>
  getBroadcastRecipientsCount: ReturnType<typeof useGetBroadcastRecipientsCount>
  formState: {
    segmentId: string
    subject: string
    previewText: string
    fromName: string
    fromEmail: string
    replyToEmail: string
  }
  setFormState: React.Dispatch<
    React.SetStateAction<ComposeBroadcastContextInterface["formState"]>
  >
}

export const [ComposeBroadcastProvider, useComposeBroadcastContext] =
  createContext<ComposeBroadcastContextInterface>("ComposeBroadcast")
