import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Button } from '@kibamail/owly/button'
import * as Dialog from '@kibamail/owly/dialog'
import * as TextField from '@kibamail/owly/text-field'
import { Text } from '@kibamail/owly/text'
import type React from 'react'
import { useState } from 'react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

import { route } from '#root/core/shared/routes/route_aliases.js'

interface CreateWorkspaceFlowProps {
  children: React.ReactNode
  onOpenChange?: (open: boolean) => void
}

export function CreateWorkspaceFlow({
  children,
  onOpenChange,
}: CreateWorkspaceFlowProps) {
  const [open, setOpen] = useState(false)
  const { serverFormProps, isPending, error, ServerErrorsList } = useServerFormMutation<{
    id: string
  }>({
    action: route('create_team'),
    async onSuccess() {
      window.location.reload()
    },
  })

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Create a new workspace</Dialog.Title>
          <VisuallyHidden>
            <Dialog.Description>Create a workspace</Dialog.Description>
          </VisuallyHidden>
        </Dialog.Header>

        <div className="px-5 pt-2 pb-4">
          <Text className="kb-content-secondary text-sm leading-relaxed">
            With a verified sending domain, you can send emails that represent your
            business and follows best email practices. Add your domain and follow
            configuration steps to start sending emails using this domain.
          </Text>
        </div>

        <ServerForm {...serverFormProps}>
          <div className="px-5 pb-5">
            <TextField.Root placeholder="e.g. Marketing Team" name="name" required>
              <TextField.Label>Workspace name</TextField.Label>
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
              Create workspace
            </Button>
          </Dialog.Footer>
        </ServerForm>
      </Dialog.Content>
    </Dialog.Root>
  )
}
