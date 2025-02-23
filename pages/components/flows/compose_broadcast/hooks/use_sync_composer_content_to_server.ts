import { ComposeBroadcastSteps } from '@/pages/components/flows/compose_broadcast/compose_broadcast_types.js'
import { useDebounceCallback } from '@react-hook/debounce'
import { type MutationOptions, useMutation } from '@tanstack/react-query'
import type React from 'react'
import { usePageContext } from 'vike-react/usePageContext'

import type { UpdateBroadcastDto } from '@/broadcasts/dto/update_broadcast_dto.js'

import { route } from '@/shared/routes/route_aliases.js'

export interface UseSyncComposerContentToServerProps {
  currentStep: number
  setStep: React.Dispatch<React.SetStateAction<number>>
  mutationOptions?: Omit<MutationOptions<any, any, any, any>, 'mutationFn'>
}

export function useSyncComposerContentToServer({
  currentStep,
  setStep,
  mutationOptions,
}: UseSyncComposerContentToServerProps) {
  const ctx = usePageContext()

  const syncContentToServerMutation = useMutation({
    async mutationFn(broadcastDto: Partial<UpdateBroadcastDto>) {
      await fetch(route('update_broadcast', { uuid: ctx?.routeParams?.uuid }), {
        method: 'PUT',
        body: JSON.stringify(broadcastDto),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    },
    onSuccess() {
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
    ...mutationOptions,
  })

  syncContentToServerMutation.mutate = useDebounceCallback(
    syncContentToServerMutation.mutate,
    1500,
  )

  return syncContentToServerMutation
}
