import { FormState, ImportContactsProvider } from "./state/import_contacts_context.jsx"
import { StepOneUploadACsv } from "./steps/step_one_upload_a_csv.jsx"
import { StepTwoMatchCsvHeadersToContactProperties } from "./steps/step_two_match_csv_headers_to_contact_properties.jsx"
import { ButtonCard } from "@/pages/components/button/button-card.jsx"
import { CancelIcon } from "@/pages/components/icons/cancel.svg.jsx"
import * as Dialog from "@radix-ui/react-dialog"
import { FocusScope } from "@radix-ui/react-focus-scope"
import React, { PropsWithChildren, useRef } from "react"

export interface ImportContactsDialogProps {
  audienceId: string
}

export function ImportContactsDialog({
  audienceId,
  children,
}: PropsWithChildren<ImportContactsDialogProps>) {
  const [step, setStep] = React.useState(0)
  const [formState, setFormState] = React.useState<FormState>({
    contactImportId: "",
    propertiesMap: {
      email: "",
      firstName: "",
      lastName: "",
      headers: [],
      customPropertiesHeaders: [],
    },
    headerCounts: {},
    headerSamples: {},
  })

  return (
    <ImportContactsProvider
      step={step}
      setStep={setStep}
      formState={formState}
      audienceId={audienceId}
      setFormState={setFormState}
    >
      <Dialog.Root>
        <Dialog.Trigger asChild>{children}</Dialog.Trigger>
        <Dialog.Portal>
          <FocusScope>
            <Dialog.Content className="DialogContent w-screen h-screen p-10 kb-background-secondary fixed overflow-y-auto top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 focus:outline-none duration-300 ease-out [data-state='closed']:transform-[scale(95%)] [data-state='closed']:opacity-0 data-[state=open]:animate-[dialog-content-show_150ms_cubic-bezier(0.16,1,0.3,1)] data-[state=closed]:animate-[dialog-content-hide_100ms_cubic-bezier(0.16,1,0.3,1)]">
              <div className="flex justify-end pb-10">
                <Dialog.Close asChild>
                  <button
                    aria-label="Close"
                    className="hover:bg-[var(--kb-background-tertiary)]"
                  >
                    <CancelIcon />
                  </button>
                </Dialog.Close>
              </div>

              <div className="w-full max-w-[40rem] mx-auto grid grid-cols-1 gap-y-2">
                <StepOneUploadACsv />
                <StepTwoMatchCsvHeadersToContactProperties />
              </div>
            </Dialog.Content>
          </FocusScope>
        </Dialog.Portal>
      </Dialog.Root>
    </ImportContactsProvider>
  )
}
