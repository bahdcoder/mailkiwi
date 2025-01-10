import { CreateCustomContactProperty } from "@/pages/components/flows/contacts/import_contacts/steps/components/create_custom_contact_property.jsx"
import { PlusIcon } from "@/pages/components/icons/plus.svg.jsx"
import { Button } from "@kibamail/owly/button"
import * as React from "react"

export function NewContactProperty() {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button
        variant="tertiary"
        data-testid="w-contacts-filters-new-contact-property"
        onClick={() => setOpen(true)}
      >
        <PlusIcon className="!w-5 !h-5" />
        New contact property
      </Button>
      <CreateCustomContactProperty
        open={open}
        onOpenChange={setOpen}
        form={{
          onSubmit: console.log,
          defaultValue: "Age",
        }}
      />
    </>
  )
}
