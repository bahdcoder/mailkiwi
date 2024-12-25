import * as CheckboxField from "@/pages/components/checkbox-field/checkbox-field.jsx"
import { useImportcontactsContext } from "@/pages/components/flows/contacts/import_contacts/state/import_contacts_context.jsx"
import { NavArrowLeftIcon } from "@/pages/components/icons/nav-arrow-left.svg.jsx"
import {
  ServerForm,
  useServerFormMutation,
} from "@/pages/components/server-form-mutation/hooks/use-server-form-mutation.jsx"
import {
  type ComboboxItem,
  TagsCombobox,
} from "@/pages/components/tags/tags_combobox.jsx"
import { Button } from "@kibamail/owly/button"
import { Heading } from "@kibamail/owly/heading"
import { Text } from "@kibamail/owly/text"
import * as Dialog from "@radix-ui/react-dialog"
import * as React from "react"

import { route } from "@/shared/routes/route_aliases.js"

export function StepThreeImportSettings() {
  const { step, setStep, formState } = useImportcontactsContext("ImportSettings")
  const { serverFormProps, isPending } = useServerFormMutation({
    action: route("update_contacts_import", { importId: formState.contactImportId }),
    onSuccess() {
      setStep((current) => current + 1)
    },
  })

  const selectedTagsRef = React.useRef<ComboboxItem[]>([])

  function onGoBack() {
    setStep((current) => current - 1)
  }

  function onTagsChange(selectedTags: ComboboxItem[]) {
    selectedTagsRef.current = selectedTags
  }

  return (
    <div className="pt-10 lg:pt-24 flex flex-col gap-y-2">
      <Dialog.Title asChild className="text-left">
        <Heading>Tag new subscribers</Heading>
      </Dialog.Title>

      <Dialog.Description asChild>
        <Text as="p">
          You may optionally tag all new subscribers with a new or existing tag. That way,
          you can segment and filter by them in future.
        </Text>
      </Dialog.Description>

      <div className="my-6 grid grid-cols-1 gap-y-6">
        {/* TODO: Load all tags from user's account and populate into the items list here. tags will be from usePageContext, and available globally. */}
        <TagsCombobox items={[]} maxWidth={640} name="tags" onChange={onTagsChange} />

        <CheckboxField.Root id="subscribeAllContacts" name="subscribeAllContacts">
          <CheckboxField.Label htmlFor="subscribeAllContacts">
            Auto subscribe all contacts
          </CheckboxField.Label>
          <CheckboxField.Description>
            We'll automatically subscribe all new subscribers to your audience. By
            checking this option, you agree that all the contacts in the import have
            consented to being subscribed to your newsletter.
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
        <Button variant="tertiary" onClick={onGoBack}>
          <NavArrowLeftIcon />
          Back to matching columns
        </Button>

        <Button onClick={console.log}>Finish</Button>
      </div>
    </div>
  )
}
