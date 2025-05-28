import { createContext } from '@radix-ui/react-context'

import type { UpdateContactImportSettingsDto } from '#root/core/audiences/dto/contact_imports/update_contact_import_settings_dto.js'

export type FormState = {
  contactImportId: string
  propertiesMap: Omit<
    UpdateContactImportSettingsDto['propertiesMap'],
    'customProperties'
  > & {
    headers: string[]
    customPropertiesHeaders: string[]
  }

  headerCounts: Record<string, number>
  headerSamples: Record<string, string[]>

  contactProperties: UpdateContactImportSettingsDto['propertiesMap']
}

export const [ImportContactsProvider, useImportcontactsContext] = createContext<{
  audienceId: string
  formState: FormState
  setFormState: React.Dispatch<React.SetStateAction<FormState>>

  step: number
  setStep: React.Dispatch<React.SetStateAction<number>>
}>('ImportContacts')
