import { NewContactPropertyForm } from "@/pages/w/engage/contacts/components/actions/new_contact_property_form.jsx"

import { KnownAudienceProperty } from "@/database/schema.js"

export interface UpdateContactPropertyProps {
  property: KnownAudienceProperty | null
  setProperty: React.Dispatch<React.SetStateAction<KnownAudienceProperty | null>>
}

export function UpdateContactProperty({
  property,
  setProperty,
}: UpdateContactPropertyProps) {
  return (
    <NewContactPropertyForm
      property={property}
      open={property !== null}
      setOpen={function () {
        setProperty(null)
      }}
    />
  )
}
