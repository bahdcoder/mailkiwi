import { useValidateBroadcastContentMutation } from "@/pages/components/flows/compose_broadcast/hooks/use_validate_broadcast_content_mutation.js"
import { createContext } from "@radix-ui/react-context"
import { UseMutationResult } from "@tanstack/react-query"
import React from "react"

export interface ComposeBroadcastContextInterface {
  syncContentToServerMutation: UseMutationResult<
    void,
    any,
    {
      emailContent: Record<string, any>
    },
    any
  >
  validateBroadcastEmailContentMutation: ReturnType<
    typeof useValidateBroadcastContentMutation
  >
  step: number
  setStep: React.Dispatch<React.SetStateAction<number>>
}

export const [ComposeBroadcastProvider, useComposeBroadcastContext] =
  createContext<ComposeBroadcastContextInterface>("ComposeBroadcast")
