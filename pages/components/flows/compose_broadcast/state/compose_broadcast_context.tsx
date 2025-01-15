import { createContext } from "@radix-ui/react-context"

export type FormState = {}

export const [ComposeBroadcastProvider, useComposeBroadcastContext] = createContext<{}>(
  "ComposeBroadcast",
)
