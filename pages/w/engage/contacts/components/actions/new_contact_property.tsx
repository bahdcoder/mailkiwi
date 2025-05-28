import { PlusIcon } from '#root/pages/components/icons/plus.svg.jsx'
import { NewContactPropertyForm } from '#root/pages/w/engage/contacts/components/actions/new_contact_property_form.jsx'
import { Button } from '@kibamail/owly/button'
import * as React from 'react'

export type NewContactPropertyProps = Record<string, never>

export function NewContactProperty(_props: NewContactPropertyProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button
        variant="tertiary"
        data-testid="w-contacts-filters-new-contact-property"
        onClick={() => setOpen(true)}
      >
        <PlusIcon className="w-5! h-5!" />
        New contact property
      </Button>
      <NewContactPropertyForm open={open} setOpen={setOpen} />
    </>
  )
}
