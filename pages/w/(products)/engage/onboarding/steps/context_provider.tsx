import { createContext } from '@radix-ui/react-context'

import type { UpdateContactImportSettingsDto } from '#root/core/audiences/dto/contact_imports/update_contact_import_settings_dto.js'

export type FormState = {
  audienceId: string
  contactImportId: string
  propertiesMap: UpdateContactImportSettingsDto['propertiesMap']
}

export const [OnboardingProvider, useOnboardingContext] = createContext<{
  step: number
  setStep: React.Dispatch<React.SetStateAction<number>>

  formState: FormState
  setFormState: React.Dispatch<React.SetStateAction<FormState>>
}>('LettersOnboarding')
