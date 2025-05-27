import { NavArrowRightIcon } from '#root/pages/components/icons/nav-arrow-right.svg.jsx'
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { navigate } from '#root/pages/utils/navigate.js'
import type { EngagePageProps } from '#root/pages/w/engage/+Page.jsx'
import { Button } from '@kibamail/owly/button'
import * as Dialog from '@kibamail/owly/dialog'
import * as SelectField from '@kibamail/owly/select-field'
import * as TextField from '@kibamail/owly/text-field'
import type React from 'react'
import { usePageContext } from 'vike-react/usePageContext'

import { route } from '#root/core/shared/routes/route_aliases.js'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { DefaultPageProps } from '#root/pages/types/page-context.js'
import type { BroadcastGroupWithBroadcasts } from '#root/database/database_schema_types.js'
import { usePageContextWithProps } from '#root/pages/hooks/use_page_props.js'
import { Heading } from '@react-email/components'

export interface ChangePasswordDialogProps extends React.PropsWithChildren {}

export interface PageProps {
  groups: BroadcastGroupWithBroadcasts[]
}

export function ChangePasswordDialog({ children }: ChangePasswordDialogProps) {
  const {
    pageProps: { groups },
    audience,
  } = usePageContextWithProps<PageProps>()

  const { serverFormProps, isPending, error, ServerErrorsList } = useServerFormMutation<{
    id: string
  }>({
    action: route('create_broadcast'),
    transform(form) {
      form.audienceId = audience?.id
      return form
    },
    async onSuccess(response) {
      await navigate(route('broadcasts_composer', { uuid: response.payload.id }))
    },
  })

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Change password</Dialog.Title>
          <Dialog.Description>Create a new password</Dialog.Description>

          <ServerForm {...serverFormProps}>
            <div className="py-3 grid grid-cols-1 gap-4 ">
              <TextField.Root
                placeholder="Enter current password"
                name="current_password"
              >
                <TextField.Label>Current password</TextField.Label>
                {error?.errorsMap?.current_password ? (
                  <TextField.Error>{error?.errorsMap?.current_password}</TextField.Error>
                ) : null}
              </TextField.Root>
              {ServerErrorsList}
            </div>
            <div className="py-3 grid grid-cols-1 gap-4 ">
              <TextField.Root placeholder="Enter current password" name="new_password">
                <TextField.Label>New password</TextField.Label>
                {error?.errorsMap?.new_password ? (
                  <TextField.Error>{error?.errorsMap?.new_password}</TextField.Error>
                ) : null}
              </TextField.Root>
              {ServerErrorsList}
            </div>
            <div className="py-3 grid grid-cols-1 gap-4 ">
              <TextField.Root placeholder="Confirm new password" name="confirm_password">
                <TextField.Label>Confirm new password</TextField.Label>
                {error?.errorsMap?.email ? (
                  <TextField.Error>{error?.errorsMap?.email}</TextField.Error>
                ) : null}
              </TextField.Root>
              {ServerErrorsList}
            </div>
          </ServerForm>
        </Dialog.Header>
        <Dialog.Footer className="flex justify-center gap-10 py-8">
          <Dialog.Close asChild disabled={isPending}>
            <Button variant="tertiary" className="flex-1">
              Cancel
            </Button>
          </Dialog.Close>
          <Button type="submit" loading={isPending} className="flex-1">
            Update password
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}
