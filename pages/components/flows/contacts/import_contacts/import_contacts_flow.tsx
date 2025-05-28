import { StepsRenderer } from '#root/pages/components/flows/steps_renderer.jsx'
import { CancelIcon } from '#root/pages/components/icons/cancel.svg.jsx'
import * as Dialog from '@radix-ui/react-dialog'
import { FocusScope } from '@radix-ui/react-focus-scope'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import React, { type PropsWithChildren } from 'react'
import { clientOnly } from 'vike-react/clientOnly'
import {
  type FormState,
  ImportContactsProvider,
} from './state/import_contacts_context.jsx'

const StepOneUploadACsv = clientOnly(() =>
  import('./steps/step_one_upload_a_csv.jsx').then(
    ({ StepOneUploadACsv }) => StepOneUploadACsv,
  ),
)

const StepFourImportProcessing = clientOnly(() =>
  import('./steps/step_four_import_processing.jsx').then(
    ({ StepFourImportProcessing }) => StepFourImportProcessing,
  ),
)

const StepTwoMatchCsvHeadersToContactProperties = clientOnly(() =>
  import('./steps/step_two_match_csv_headers_to_contact_properties.jsx').then(
    ({ StepTwoMatchCsvHeadersToContactProperties }) =>
      StepTwoMatchCsvHeadersToContactProperties,
  ),
)

const StepThreeImportSettings = clientOnly(() =>
  import('./steps/step_three_import_settings.jsx').then(
    ({ StepThreeImportSettings }) => StepThreeImportSettings,
  ),
)

export interface ImportContactsDialogProps
  extends React.ComponentProps<typeof Dialog.Root> {
  audienceId: string
  onImportCompleted?: () => void
}

export function ImportContactsDialog({
  audienceId,
  children,
  onImportCompleted,
  ...dialogRootProps
}: PropsWithChildren<ImportContactsDialogProps>) {
  const [step, setStep] = React.useState(0)
  const [formState, setFormState] = React.useState<FormState>({
    contactImportId: '',
    propertiesMap: {
      email: '',
      firstName: '',
      lastName: '',
      headers: [],
      customPropertiesHeaders: [],
    },
    headerCounts: {},
    headerSamples: {},
    contactProperties: {
      email: '',
    },
  })

  const { onOpenChange: onOpenChangeProp, ...restDialogRootProps } = dialogRootProps

  function onOpenChange(open: boolean) {
    if (open === false) {
      onImportCompleted?.()
    }
    onOpenChangeProp?.(open)
  }

  return (
    <ImportContactsProvider
      step={step}
      setStep={setStep}
      formState={formState}
      audienceId={audienceId}
      setFormState={setFormState}
    >
      <Dialog.Root onOpenChange={onOpenChange} {...restDialogRootProps}>
        <Dialog.Trigger asChild>{children}</Dialog.Trigger>
        <Dialog.Portal>
          <FocusScope>
            <VisuallyHidden>
              <Dialog.Title>Import Contacts</Dialog.Title>
              <Dialog.Description>
                Upload a CSV file to import contacts into your audience.
              </Dialog.Description>
            </VisuallyHidden>
            <Dialog.Content className="w-screen h-screen p-6 lg:p-10 kb-background-secondary fixed overflow-y-auto top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 focus:outline-none duration-300 ease-out [data-state='closed']:transform-[scale(95%)] [data-state='closed']:opacity-0 data-[state=open]:animate-[dialog-content-show_150ms_cubic-bezier(0.16,1,0.3,1)] data-[state=closed]:animate-[dialog-content-hide_100ms_cubic-bezier(0.16,1,0.3,1)] z-2">
              <div className="flex justify-end pb-6 lg:pb-10">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Close"
                    className="hover:bg-(--kb-background-tertiary)"
                  >
                    <CancelIcon />
                  </button>
                </Dialog.Close>
              </div>

              <div className="w-full max-w-160 mx-auto grid grid-cols-1 gap-y-2">
                <StepsRenderer
                  current={step}
                  steps={{
                    0: StepOneUploadACsv,
                    1: StepTwoMatchCsvHeadersToContactProperties,
                    2: StepThreeImportSettings,
                    3: StepFourImportProcessing,
                  }}
                />
              </div>
            </Dialog.Content>
          </FocusScope>
        </Dialog.Portal>
      </Dialog.Root>
    </ImportContactsProvider>
  )
}
