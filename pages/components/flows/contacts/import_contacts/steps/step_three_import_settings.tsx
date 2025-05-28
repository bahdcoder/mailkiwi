import * as CheckboxField from '#root/pages/components/checkbox-field/checkbox-field.jsx'
import { useImportcontactsContext } from '#root/pages/components/flows/contacts/import_contacts/state/import_contacts_context.jsx'
import { NavArrowLeftIcon } from '#root/pages/components/icons/nav-arrow-left.svg.jsx'
import {
  type ComboboxItem,
  TagsCombobox,
} from '#root/pages/components/tags/tags_combobox.jsx'
import {
  type FormPayload,
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import * as Dialog from '@radix-ui/react-dialog'
import * as React from 'react'

import { route } from '#root/core/shared/routes/route_aliases.js'
import { usePageContext } from 'vike-react/usePageContext'

export function StepThreeImportSettings() {
  const selectedTagsRef = React.useRef<ComboboxItem[]>([])

  const { pageProps: ctx } = usePageContext()

  const { setStep, formState, audienceId } = useImportcontactsContext('ImportSettings')

  const { serverFormProps, isPending, ServerErrorsList } = useServerFormMutation({
    method: 'PUT',
    action: route('update_contacts_import', {
      importId: formState.contactImportId,
      audienceId,
    }),
    onSuccess() {
      setStep((current) => current + 1)
    },
    transform(form) {
      const tags: string[] = []
      const tagIds: string[] = []

      for (const item of selectedTagsRef.current) {
        if (item.new) {
          tags.push(item.label)
        } else {
          tagIds.push(item.id)
        }
      }

      form.tags = tags
      form.tagIds = tagIds
      form.subscribeAllContacts = form.subscribeAllContacts === 'on'
      form.updateExistingContacts = form.updateExistingContacts === 'on'

      form.propertiesMap = formState.contactProperties as unknown as FormPayload[string]

      return form
    },
  })

  function onGoBack() {
    setStep((current) => current - 1)
  }

  function onTagsChange(selectedTags: ComboboxItem[]) {
    selectedTagsRef.current = selectedTags
  }

  return (
    <ServerForm {...serverFormProps} className="pt-10 lg:pt-24 flex flex-col gap-y-2">
      <Dialog.Title asChild className="text-left">
        <Heading>Tag new contacts</Heading>
      </Dialog.Title>

      <Dialog.Description asChild>
        <Text as="p">
          You may optionally tag all new contacts with a new or existing tag. That way,
          you can segment and filter by them in future.
        </Text>
      </Dialog.Description>

      {ServerErrorsList}

      <div className="my-6 grid grid-cols-1 gap-y-6">
        {/* TODO: Load all tags from user's account and populate into the items list here. tags will be from usePageContext, and available globally. */}
        <TagsCombobox items={[]} maxWidth={640} name="tags" onChange={onTagsChange} />

        <CheckboxField.Root id="subscribeAllContacts" name="subscribeAllContacts">
          <CheckboxField.Label htmlFor="subscribeAllContacts">
            Auto subscribe all contacts
          </CheckboxField.Label>
          <CheckboxField.Description>
            We'll automatically subscribe all new contacts to your audience. By checking
            this option, you agree that all the contacts in the import have consented to
            being subscribed to your newsletter.
          </CheckboxField.Description>
        </CheckboxField.Root>

        <CheckboxField.Root id="updateExistingContacts" name="updateExistingContacts">
          <CheckboxField.Label htmlFor="updateExistingContacts">
            Update any existing contacts
          </CheckboxField.Label>
          <CheckboxField.Description>
            As we import your contacts, if we encounter duplicates, we will automatically
            overwrite the existing contact with the new information from your CSV.
          </CheckboxField.Description>
        </CheckboxField.Root>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button type="button" variant="tertiary" onClick={onGoBack}>
          <NavArrowLeftIcon />
          Back to matching columns
        </Button>

        <Button type="submit" loading={isPending}>
          Finish
        </Button>
      </div>
    </ServerForm>
  )
}
