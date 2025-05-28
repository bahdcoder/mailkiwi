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

export interface CreateBroadcastFlowProps extends React.PropsWithChildren {}

export interface PageProps {
  groups: BroadcastGroupWithBroadcasts[]
}

export function CreateBroadcastFlow({ children }: CreateBroadcastFlowProps) {
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
          <Dialog.Title>Create a new broadcast</Dialog.Title>
          <VisuallyHidden>
            <Dialog.Description>Create a broadcast</Dialog.Description>
          </VisuallyHidden>
        </Dialog.Header>
        <ServerForm {...serverFormProps}>
          <div className="p-5 grid grid-cols-1 gap-4 ">
            <TextField.Root
              placeholder="Pick a name for your broadcast - for internal use"
              name="name"
            >
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
