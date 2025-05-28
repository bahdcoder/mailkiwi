import { NavArrowRightIcon } from '#root/pages/components/icons/nav-arrow-right.svg.jsx'
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { navigate } from '#root/pages/utils/navigate.js'
import { Button } from '@kibamail/owly/button'
import * as Dialog from '@kibamail/owly/dialog'
import * as TextField from '@kibamail/owly/text-field'
import type React from 'react'
import { usePageContext } from 'vike-react/usePageContext'

import { route } from '#root/core/shared/routes/route_aliases.js'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

export interface CreateAutomationFlowProps extends React.PropsWithChildren {}

export function CreateAutomationFlow({ children }: CreateAutomationFlowProps) {
  const { audience } = usePageContext()

  const { serverFormProps, isPending, error, ServerErrorsList } = useServerFormMutation<{
    id: string
  }>({
    action: route('create_automation', { audienceId: audience?.id }),
    async onSuccess(response) {
      await navigate(route('automation_composer', { uuid: response.payload.id }))
    },
  })

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Create a new flow</Dialog.Title>
          <VisuallyHidden>
            <Dialog.Description>Create a flow</Dialog.Description>
          </VisuallyHidden>
        </Dialog.Header>
        <ServerForm {...serverFormProps}>
          <div className="p-5 grid grid-cols-1 gap-4 ">
            <TextField.Root placeholder="Pick a name for your flow" name="name">
              <TextField.Label>Flow name</TextField.Label>
              {error?.errorsMap?.name ? (
                <TextField.Error>{error?.errorsMap?.name}</TextField.Error>
              ) : null}
            </TextField.Root>

            {ServerErrorsList}
          </div>
          <Dialog.Footer className="flex justify-between">
            <Dialog.Close asChild disabled={isPending}>
              <Button variant="secondary">Close</Button>
            </Dialog.Close>
            <Button type="submit" loading={isPending}>
              Continue
              <NavArrowRightIcon />
            </Button>
          </Dialog.Footer>
        </ServerForm>
      </Dialog.Content>
    </Dialog.Root>
  )
}
