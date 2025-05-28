import { ArrowUpRightIcon } from '#root/pages/components/icons/arrow-up-right.svg.jsx'
import { InfoCircleIcon } from '#root/pages/components/icons/info-circle.svg.jsx'
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { FilterCondition } from '#root/pages/w/engage/contacts/components/filters.jsx'
import * as Alert from '@kibamail/owly/alert'
import { Button } from '@kibamail/owly/button'
import * as Dialog from '@kibamail/owly/dialog'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import * as React from 'react'
import { usePageContext } from 'vike-react/usePageContext'
import { reload } from 'vike/client/router'

import type { CreateSegmentDto } from '#root/core/audiences/dto/segments/create_segment_dto.js'

import type { Audience } from '#root/database/database_schema_types.js'

import { route } from '#root/core/shared/routes/route_aliases.js'
import { usePageContextWithProps } from '#root/pages/hooks/use_page_props.js'

export interface SaveFilterAsSegmentFormProps extends React.PropsWithChildren {
  filterGroups: CreateSegmentDto['filterGroups']
  onSuccess?: () => void
}

export function SaveFilterAsSegmentForm({
  children,
  filterGroups,
  onSuccess,
}: SaveFilterAsSegmentFormProps) {
  const { audience } = usePageContextWithProps()
  const [open, setOpen] = React.useState(false)

  const { isPending, serverFormProps, ServerErrorsList } =
    useServerFormMutation<Audience>({
      method: 'POST',
      action: route('create_segment', { audienceId: audience?.id }),
      onSuccess() {
        // No need to reload, the parent component will handle this
        onSuccess?.()
        setOpen(false)

        // TODO: Flash a toast message to the user.
      },
      transform(form) {
        form.filterGroups = filterGroups
        return form
      },
    })

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title className="text-center">Create a segment</Dialog.Title>
          <Dialog.Description className="text-center">
            Save the currently active filters as a segment
          </Dialog.Description>
        </Dialog.Header>

        <ServerForm {...serverFormProps}>
          <div className="p-6 grid grid-cols-1 gap-6">
            {ServerErrorsList}
            <TextField.Root
              autoFocus
              name="name"
              id="save-filters-as-segment-name"
              data-testid="save-filters-as-segment-name"
              placeholder={'Digital marketers, 5 - 10+ years of experience, etc.'}
            >
              <TextField.Label htmlFor="save-filters-as-segment-name">
                Name
              </TextField.Label>
            </TextField.Root>

            <Alert.Root variant="info">
              <Alert.Icon>
                <InfoCircleIcon />
              </Alert.Icon>
              <div className="flex flex-col w-full">
                <Alert.Title className="font-medium">About segments</Alert.Title>

                <Text as="p" className="kb-content-secondary mt-1">
                  Segments are a way to save common contact filters.
                  <a
                    href="/docs/segments"
                    className="underline underline-offset-4 inline-flex items-center gap-1 mt-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn more about segments here.
                    <ArrowUpRightIcon className="w-4! h-4!" />
                  </a>
                </Text>
              </div>
            </Alert.Root>
          </div>

          <Dialog.Footer className="flex justify-between gap-2">
            <Dialog.Close asChild type="button">
              <Button variant="tertiary" width={'full'} type="button">
                Close
              </Button>
            </Dialog.Close>
            <Button width="full" type="submit" loading={isPending}>
              Save segment
            </Button>
          </Dialog.Footer>
        </ServerForm>
      </Dialog.Content>
    </Dialog.Root>
  )
}
