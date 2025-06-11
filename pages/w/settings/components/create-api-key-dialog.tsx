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
import * as SelectField from '@kibamail/owly/select-field'
import { route } from '#root/core/shared/routes/route_aliases.js'
import { ArrowUpRightIcon } from '#root/pages/components/icons/arrow-up-right.svg.jsx'
import { CopyIcon } from '#root/pages/components/icons/copy.svg.jsx'
import * as Alert from '@kibamail/owly/alert'
import { CheckCircleIcon } from '../../../components/icons/check-circle.svg.jsx'

interface CreateWorkspaceFlowProps {
  children: React.ReactNode
  onOpenChange?: (open: boolean) => void
}

export function CreateApiKeyDialog({ children, onOpenChange }: CreateWorkspaceFlowProps) {
  const [open, setOpen] = useState(false)
  const { serverFormProps, isPending, error, ServerErrorsList, isSuccess, data } =
    useServerFormMutation<{
      apiKey: string
    }>({
      action: route('create_api_key'),
      async onSuccess(response) {
        console.log({ response })
        // window.location.reload();
      },
    })

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  const capabilities = ['full', 'engage', 'send']

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Create a new api key</Dialog.Title>
          <VisuallyHidden>
            <Dialog.Description>Create a new api key</Dialog.Description>
          </VisuallyHidden>
        </Dialog.Header>

        <div className="px-5 pt-2 pb-4">
          <Text className="kb-content-secondary text-sm leading-relaxed flex flex-col">
            API keys allow you to interact with the kibamail API to send emails, manage
            contacts, and more. You may use any of our SDKs to interact with the API, or
            send emails directly using SMTP
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://kibamail.com/docs/api/"
              className="underline kb-content-tertiary mt-2 flex items-center"
            >
              Learn more about api access
              <ArrowUpRightIcon className="w-4 h-4 ml-2" />
            </a>
          </Text>
        </div>

        {isSuccess ? (
          <div className="px-5 pb-5">
            <TextField.Root
              autoFocus
              value={data?.payload?.apiKey}
              readOnly
              className="[&>input]:overflow-hidden"
            >
              <TextField.Slot side="right">
                <button type="button" className="cursor-pointer">
                  <TextField.HintIcon>
                    <CopyIcon />
                  </TextField.HintIcon>
                </button>
              </TextField.Slot>
            </TextField.Root>
          </div>
        ) : (
          <ServerForm {...serverFormProps}>
            <div className="px-5 pb-5">
              <TextField.Root placeholder="Your api key name" name="name" required>
                <TextField.Label>API key name</TextField.Label>
                {error?.errorsMap?.name ? (
                  <TextField.Error>{error?.errorsMap?.name}</TextField.Error>
                ) : null}
              </TextField.Root>
            </div>

            <div className="px-5 pb-5">
              <SelectField.Root defaultValue={capabilities?.[0]} name="capabilities">
                <SelectField.Label>Choose api key permissions</SelectField.Label>
                <SelectField.Trigger className="capitalize" />
                <SelectField.Content className="z-50 relative">
                  {capabilities?.map((capability) => (
                    <SelectField.Item
                      key={capability}
                      value={capability}
                      className="capitalize"
                    >
                      {capability}
                    </SelectField.Item>
                  ))}
                </SelectField.Content>
                {error?.errorsMap?.capabilities ? (
                  <SelectField.Error>{error?.errorsMap?.capabilities}</SelectField.Error>
                ) : null}
              </SelectField.Root>
            </div>

            {ServerErrorsList}
            <Dialog.Footer className="flex justify-between">
              <Dialog.Close asChild disabled={isPending}>
                <Button variant="secondary">Close</Button>
              </Dialog.Close>
              <Button type="submit" loading={isPending}>
                Create api key
              </Button>
            </Dialog.Footer>
          </ServerForm>
        )}

        <div className="px-5 pb-8">
          <Alert.Root variant="success">
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Alert.Icon>
                  <CheckCircleIcon />
                </Alert.Icon>
                <Alert.Title className="font-medium">
                  API key created successfully
                </Alert.Title>
              </div>

              <Button size="sm" variant="secondary">
                Copy api key
              </Button>
            </div>
          </Alert.Root>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  )
}
