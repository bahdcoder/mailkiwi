import { ArrowLeftIcon } from '#root/pages/components/icons/arrow-left.svg.jsx'
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { slugify } from '#root/pages/utils/slugify.js'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Progress } from '@kibamail/owly/progress'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import { createContext } from '@radix-ui/react-context'
import React from 'react'
import { usePageContext } from 'vike-react/usePageContext'
import { useOnboardingContext } from './context_provider.js'

import { route } from '#root/core/shared/routes/route_aliases.js'

export function CreateBroadcastGroupStep() {
  const { pageProps: ctx } = usePageContext()
  const { step, setStep, setFormState } = useOnboardingContext('CreateBroadcastGroupStep')

  const { serverFormProps, isPending, error } = useServerFormMutation<{
    id: string
  }>({
    action: route('create_broadcast_group'),
    onSuccess(response) {
      setStep((current) => current + 1)
      setFormState((current) => ({
        ...current,
        audienceId: response.payload.id,
      }))
    },
  })

  if (step !== 0) {
    return null
  }

  return (
    <ServerForm {...serverFormProps}>
      <Heading className="font-display kb-content-brand text-xl mb-2">
        Create a broadcast group
      </Heading>
      <Text className="kb-content-tertiary" as="label" htmlFor="slug">
        A broadcast group is a great way to organise all your marketing emails. Examples
        would be <strong className="kb-content-brand">Newsletters</strong>,{' '}
        <strong className="kb-content-brand">Promotions</strong>, or{' '}
        <strong className="kb-content-brand">Weekly changelogs</strong>.
      </Text>

      <div className="flex items-center mt-6 gap-x-2">
        <TextField.Root autoFocus id="name" name="name" placeholder="Newsletters">
          {error?.errorsMap?.name ? (
            <TextField.Error>{error.errorsMap.name}</TextField.Error>
          ) : null}
        </TextField.Root>
      </div>

      <Button type="submit" loading={isPending} className="mt-6">
        Continue
      </Button>
    </ServerForm>
  )
}
