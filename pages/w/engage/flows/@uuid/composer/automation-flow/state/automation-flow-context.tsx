import type {
  AutomationStep,
  AutomationWithSteps,
} from '#root/database/database_schema_types.js'
import { usePageContextWithProps } from '#root/pages/hooks/use_page_props.js'
import { createContext } from '@radix-ui/react-context'
import React, { type PropsWithChildren } from 'react'

interface AutomationFlowContextState {
  steps: AutomationStep[]
}

const [AutomationFlowContextProvider] = createContext<AutomationFlowContextState>(
  'AutomationFlowBuilder',
  {
    steps: [],
  },
)

export function AutomationFlowProvider({ children }: PropsWithChildren) {
  const {
    pageProps: { automation },
  } = usePageContextWithProps<{ automation: AutomationWithSteps }>()

  return (
    <AutomationFlowContextProvider steps={[]}>{children}</AutomationFlowContextProvider>
  )
}
