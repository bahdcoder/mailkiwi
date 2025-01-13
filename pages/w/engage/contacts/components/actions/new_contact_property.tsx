import { ArrowUpRightIcon } from "@/pages/components/icons/arrow-up-right.svg.jsx"
import { CalendarIcon } from "@/pages/components/icons/calendar.jsx"
import { CheckSquareIcon } from "@/pages/components/icons/check-square.svg.jsx"
import { HashTagIcon } from "@/pages/components/icons/hashtag.svg.jsx"
import { InfoCircleIcon } from "@/pages/components/icons/info-circle.svg.jsx"
import { PlusIcon } from "@/pages/components/icons/plus.svg.jsx"
import { TextIcon } from "@/pages/components/icons/text.svg.jsx"
import {
  ServerForm,
  useServerFormMutation,
} from "@/pages/components/server-form-mutation/hooks/use-server-form-mutation.jsx"
import { slugify } from "@/pages/utils/slugify.js"
import { NewContactPropertyForm } from "@/pages/w/engage/contacts/components/actions/new_contact_property_form.jsx"
import * as Alert from "@kibamail/owly/alert"
import { Button } from "@kibamail/owly/button"
import * as Dialog from "@kibamail/owly/dialog"
import * as Select from "@kibamail/owly/select-field"
import { Text } from "@kibamail/owly/text"
import * as TextField from "@kibamail/owly/text-field"
import * as React from "react"
import { clientOnly } from "vike-react/clientOnly"
import { usePageContext } from "vike-react/usePageContext"
import { reload } from "vike/client/router"

import { Audience } from "@/database/database_schema_types.js"
import { KnownAudienceProperty } from "@/database/schema.js"

import { route } from "@/shared/routes/route_aliases.js"

const CreateCustomContactProperty = clientOnly(() =>
  import(
    "@/pages/components/flows/contacts/import_contacts/steps/components/create_custom_contact_property.jsx"
  ).then(({ CreateCustomContactProperty }) => CreateCustomContactProperty),
)

export interface NewContactPropertyProps {}

export function NewContactProperty(_props: NewContactPropertyProps) {
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
      <NewContactPropertyForm open={open} setOpen={setOpen} />
    </>
  )
}
