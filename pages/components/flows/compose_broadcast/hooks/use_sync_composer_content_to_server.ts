import { ComposeBroadcastSteps } from '#root/pages/components/flows/compose_broadcast/compose_broadcast_types.js'
import { useDebounceCallback } from '@react-hook/debounce'
import type { MutationOptions } from '@tanstack/react-query'
import type React from 'react'
import { usePageContext } from 'vike-react/usePageContext'

import { useServerFormMutation } from '#root/pages/hooks/use_server_form_mutation.jsx'
import { route } from '#root/core/shared/routes/route_aliases.js'

export interface UseSyncComposerContentToServerProps {
  currentStep: number
  setStep: React.Dispatch<React.SetStateAction<number>>
  mutationOptions?: Omit<
    MutationOptions<unknown, unknown, unknown, unknown>,
    'mutationFn'
  >
}

export function useSyncComposerContentToServer({
  currentStep,
  setStep,
  mutationOptions,
}: UseSyncComposerContentToServerProps) {
  const { routeParams } = usePageContext()

  const { onSuccess, ...restOfMutationOptions } = mutationOptions ?? {}

  const serverFormMutation = useServerFormMutation({
    action: route('update_broadcast', { uuid: routeParams?.uuid }),
    method: 'PUT',
    transform(form) {
      return form
    },
    onSuccess(...args) {
      onSuccess?.(...args)

      switch (currentStep) {
        case ComposeBroadcastSteps.COMPOSE:
          break
        case ComposeBroadcastSteps.CONTACTS:
          setStep(ComposeBroadcastSteps.CONFIGURE)
          break
        case ComposeBroadcastSteps.CONFIGURE:
          setStep(ComposeBroadcastSteps.TRACKING)
          break
        case ComposeBroadcastSteps.TRACKING:
          setStep(ComposeBroadcastSteps.PREVIEW)
          break
        default:
          break
      }
    },
    ...restOfMutationOptions,
  })

  serverFormMutation.mutate = useDebounceCallback(serverFormMutation.mutate, 1500)

  return serverFormMutation
}
