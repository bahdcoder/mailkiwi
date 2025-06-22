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
import { ConfigureSendingDomain } from './configure_sending_domain_modal.jsx'
import { usePageContextWithProps } from '#root/pages/hooks/use_page_props'
import { navigate } from '#root/pages/utils/navigate'

interface CreateSendingDomainFlowProps {
  children: React.ReactNode
  onOpenChange?: (open: boolean) => void
  product: 'send' | 'engage'
}

export function CreateSendingDomainFlow({
  children,
  onOpenChange,
  product,
}: CreateSendingDomainFlowProps) {
  const [open, setOpen] = useState(false)
  const [configureModalOpen, setConfigureModalOpen] = useState(true)

  const { user } = usePageContextWithProps()

  const tld = user.email.split('@')[1]

  const {
    serverFormProps,
    isPending,
    error,
    ServerErrorsList,
    reset,
    data: sendingDomain,
  } = useServerFormMutation<{
    id: string
  }>({
    action: route('create_sending_domain'),
    async onSuccess(response) {
      console.log({ response })
      setOpen(false)
      setConfigureModalOpen(true)
    },
  })

  function onConfigureSendingDomainDialogChanged(open: boolean) {
    setConfigureModalOpen(open)

    if (!open) {
      navigate(route('send'))
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)

    if (!newOpen) {
      setTimeout(() => {
        reset()
      }, 1000)
    }
  }

  return (
    <>
      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Trigger asChild>{children}</Dialog.Trigger>
        <Dialog.Content className="max-w-md">
          <Dialog.Header>
            <Dialog.Title>Add sending domain</Dialog.Title>
            <VisuallyHidden>
              <Dialog.Description>
                Add a new sending domain for your {product} emails
              </Dialog.Description>
            </VisuallyHidden>
          </Dialog.Header>

          <ServerForm {...serverFormProps}>
            <input type="hidden" name="product" value={product} />
            <div className="px-5 py-4">
              <div className="mb-6">
                <Text className="kb-content-secondary text-sm leading-relaxed">
                  With a verified sending domain, you can send emails that represent your
                  business and follows best email practices. Add your domain and follow
                  the configuration steps to get started sending emails using this domain.
                </Text>
              </div>
              <TextField.Root placeholder={`e.g. ${product}.${tld}`} name="name" required>
                <TextField.Label>Domain name</TextField.Label>
                <TextField.Hint>
                  You'll need to configure this domain before you can send emails with it.
                </TextField.Hint>
              </TextField.Root>

              <div className="mt-1">{ServerErrorsList}</div>
            </div>

            <Dialog.Footer className="flex justify-between">
              <Dialog.Close asChild disabled={isPending}>
                <Button variant="secondary">Cancel</Button>
              </Dialog.Close>
              <Button type="submit" loading={isPending}>
                Add domain
              </Button>
            </Dialog.Footer>
          </ServerForm>
        </Dialog.Content>
      </Dialog.Root>

      {sendingDomain?.payload?.id && (
        <ConfigureSendingDomain
          open={configureModalOpen}
          sendingDomainId={sendingDomain?.payload?.id}
          onOpenChange={onConfigureSendingDomainDialogChanged}
        />
      )}
    </>
  )
}
