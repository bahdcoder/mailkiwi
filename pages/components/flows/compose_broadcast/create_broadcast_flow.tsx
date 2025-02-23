import { NavArrowRightIcon } from '@/pages/components/icons/nav-arrow-right.svg.jsx'
import {
  ServerForm,
  useServerFormMutation,
} from '@/pages/components/server-form-mutation/hooks/use-server-form-mutation.jsx'
import { navigate } from '@/pages/utils/navigate.js'
import type { EngagePageProps } from '@/pages/w/engage/+Page.jsx'
import { Button } from '@kibamail/owly/button'
import * as Dialog from '@kibamail/owly/dialog'
import * as SelectField from '@kibamail/owly/select-field'
import * as TextField from '@kibamail/owly/text-field'
import type React from 'react'
import { usePageContext } from 'vike-react/usePageContext'

import { route } from '@/shared/routes/route_aliases.js'

export interface CreateBroadcastFlowProps extends React.PropsWithChildren {}

export function CreateBroadcastFlow({ children }: CreateBroadcastFlowProps) {
  const ctx = usePageContext()

  const { serverFormProps, isPending, error, ServerErrorsList } = useServerFormMutation<{
    id: string
  }>({
    action: route('create_broadcast'),
    transform(form) {
      form['audienceId'] = ctx.audience?.id
      return form
    },
    async onSuccess(response) {
      await navigate(route('broadcasts_composer', { uuid: response.payload.id }))
    },
  })

  const pageProps = ctx.pageProps as EngagePageProps

  const { groups } = pageProps

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Create a new broadcast</Dialog.Title>
          <Dialog.Description></Dialog.Description>
        </Dialog.Header>
        <ServerForm {...serverFormProps}>
          <div className="p-5 grid grid-cols-1 gap-4 ">
            <TextField.Root placeholder="Pick a subject for your broadcast" name="name">
              <TextField.Label>Broadcast name</TextField.Label>
              {error?.errorsMap?.name ? (
                <TextField.Error>{error?.errorsMap?.name}</TextField.Error>
              ) : null}
            </TextField.Root>
            <SelectField.Root defaultValue={groups?.[0]?.id} name="broadcastGroupId">
              <SelectField.Label>Choose a broadcast group</SelectField.Label>
              <SelectField.Trigger />
              <SelectField.Content className="z-50 relative">
                {groups?.map((group) => (
                  <SelectField.Item key={group.id} value={group.id}>
                    {group.name}
                  </SelectField.Item>
                ))}
              </SelectField.Content>
              {error?.errorsMap?.broadcastGroupId ? (
                <SelectField.Error>
                  {error?.errorsMap?.broadcastGroupId}
                </SelectField.Error>
              ) : null}
            </SelectField.Root>

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
