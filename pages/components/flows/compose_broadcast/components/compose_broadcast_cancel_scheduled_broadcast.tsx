import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { navigate } from '#root/pages/utils/navigate.js'
import { Button } from '@kibamail/owly/button'
import * as Dialog from '@kibamail/owly/dialog'
import { Text } from '@kibamail/owly/text'
import React from 'react'
import { toast } from 'sonner'
import { usePageContext } from 'vike-react/usePageContext'

import { route } from '#root/core/shared/routes/route_aliases.js'

interface CancelScheduledBroadcastProps {
  sendAt: string
}

export function CancelScheduledBroadcast({ sendAt }: CancelScheduledBroadcastProps) {
  const { routeParams } = usePageContext()

  const { serverFormProps, isPending, isSuccess } = useServerFormMutation({
    action: route('unsend_broadcast', { uuid: routeParams?.uuid }),
    onSuccess() {
      toast.success('Broadcast is no longer queued for publish.')

      navigate(route('broadcasts'))
    },
  })

  return (
    <Dialog.Root open={isSuccess ? false : undefined}>
      <Dialog.Trigger asChild>
        <Button variant="secondary">Cancel Schedule</Button>
      </Dialog.Trigger>

      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Cancel broadcast schedule</Dialog.Title>
        </Dialog.Header>

        <div className="py-4 px-6">
          <Text>
            Are you sure you want to cancel the schedule for this broadcast? This
            broadcast will no longer be published on {sendAt}
          </Text>
        </div>

        <Dialog.Footer className="flex justify-end gap-4 items-center border-transparent">
          <Dialog.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Dialog.Close>

          <ServerForm {...serverFormProps}>
            <Button type="submit" loading={isPending}>
              Cancel schedule
            </Button>
          </ServerForm>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}
