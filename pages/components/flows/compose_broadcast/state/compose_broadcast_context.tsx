import { createContext } from "@radix-ui/react-context"
import { UseMutationResult } from "@tanstack/react-query"

export interface ComposeBroadcastContextInterface {
  syncContentToServerMutation: UseMutationResult<
    void,
    any,
    {
      emailContent: Record<string, any>
    },
    any
  >
}

export const [ComposeBroadcastProvider, useComposeBroadcastContext] =
  createContext<ComposeBroadcastContextInterface>("ComposeBroadcast")
