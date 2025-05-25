import { ArrowUpRightIcon } from '#root/pages/components/icons/arrow-up-right.svg.jsx'
import { CalendarIcon } from '#root/pages/components/icons/calendar.jsx'
import { CheckSquareIcon } from '#root/pages/components/icons/check-square.svg.jsx'
import { HashTagIcon } from '#root/pages/components/icons/hashtag.svg.jsx'
import { InfoCircleIcon } from '#root/pages/components/icons/info-circle.svg.jsx'
import { PlusIcon } from '#root/pages/components/icons/plus.svg.jsx'
import { TextIcon } from '#root/pages/components/icons/text.svg.jsx'
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { slugify } from '#root/pages/utils/slugify.js'
import * as Alert from '@kibamail/owly/alert'
import { Button } from '@kibamail/owly/button'
import * as Dialog from '@kibamail/owly/dialog'
import * as Select from '@kibamail/owly/select-field'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import type * as React from 'react'
import { clientOnly } from 'vike-react/clientOnly'
import { usePageContext } from 'vike-react/usePageContext'
import { reload } from 'vike/client/router'

import type { Audience } from '#root/database/database_schema_types.js'
import type { KnownAudienceProperty } from '#root/database/schema.js'

import { route } from '#root/core/shared/routes/route_aliases.js'
import { usePageContextWithProps } from '#root/pages/hooks/use_page_props.js'

const CreateCustomContactProperty = clientOnly(() =>
  import(
    '#root/pages/components/flows/contacts/import_contacts/steps/components/create_custom_contact_property.jsx'
  ).then(({ CreateCustomContactProperty }) => CreateCustomContactProperty),
)

export interface NewContactPropertyFormProps {
  property?: KnownAudienceProperty | null
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function NewContactPropertyForm({
  property,
  open,
  setOpen,
}: NewContactPropertyFormProps) {
  const { audience } = usePageContextWithProps()

  const { isPending, serverFormProps, ServerErrorsList } =
    useServerFormMutation<Audience>({
      method: 'PUT',
      action: route('audiences_update', { audienceId: audience?.id }),
      onSuccess(response) {
        // No need to reload, the parent component will handle this
        setOpen(false)

        // TODO: Flash a toast message to the user.
      },
      transform(form) {
        if (property) {
          form.properties = [{ ...property, label: form.name }]

          return form
        }

        form.properties = [
          {
            id: slugify(form.name as string),
            label: form.name,
            type: form.type,
          },
        ]

        return form
      },
    })

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title className="text-center">
            Create custom contact property
          </Dialog.Title>
        </Dialog.Header>

        <ServerForm {...serverFormProps}>
          <div className="p-6 grid grid-cols-1 gap-6">
            {ServerErrorsList}
            <TextField.Root
              autoFocus
              name="name"
              id="custom-property-name"
              placeholder={'Job title, Interests, Company, etc.'}
              defaultValue={property?.label}
            >
              <TextField.Label htmlFor="custom-property-name">Name</TextField.Label>
            </TextField.Root>

            <Select.Root name="type" disabled={!!property} defaultValue={property?.type}>
              <Select.Label htmlFor="custom-property-type">Type</Select.Label>
              <Select.Trigger
                placeholder="Select a property type"
                id="custom-property-type"
              />
              <Select.Content className="z-99">
                <Select.Item value="text">
                  <TextIcon />
                  Text
                </Select.Item>
                <Select.Item value="number">
                  <HashTagIcon />
                  Number
                </Select.Item>
                <Select.Item value="date">
                  <CalendarIcon />
                  Date
                </Select.Item>
                <Select.Item value="boolean">
                  <CheckSquareIcon />
                  Boolean
                </Select.Item>
              </Select.Content>
            </Select.Root>

            <Alert.Root variant="info">
              <Alert.Icon>
                <InfoCircleIcon />
              </Alert.Icon>
              <div className="flex flex-col w-full">
                <Alert.Title className="font-medium">About custom properties</Alert.Title>

                <Text as="p" className="kb-content-secondary mt-1">
                  With custom properties, you may store as much meta data as you want
                  about your contacts.{' '}
                  <a
                    href="/docs/custom-properties"
                    className="underline underline-offset-4 inline-flex items-center gap-1 mt-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Read more about custom properties here.
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
              {property ? 'Update custom property' : 'Create custom property'}
            </Button>
          </Dialog.Footer>
        </ServerForm>
      </Dialog.Content>
    </Dialog.Root>
  )
}
