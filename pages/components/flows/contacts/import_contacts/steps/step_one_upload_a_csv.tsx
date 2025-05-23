import { FileUploadDropbox } from '#root/pages/components/file-upload/file-upload-dropbox.jsx'
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { InputError } from '@kibamail/owly/input-hint'
import { Text } from '@kibamail/owly/text'
import * as Dialog from '@radix-ui/react-dialog'
import React, { useRef } from 'react'
import { usePageContext } from 'vike-react/usePageContext'
import {
  type FormState,
  useImportcontactsContext,
} from '../state/import_contacts_context.jsx'

import { route } from '#root/core/shared/routes/route_aliases.js'

export function StepOneUploadACsv() {
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const formRef = useRef<HTMLFormElement | null>(null)

  const { audience } = usePageContext()
  const { setFormState, setStep } = useImportcontactsContext('UploadACsv')

  const { serverFormProps, isPending, error } = useServerFormMutation<{
    id: string
    headerCounts: FormState['headerCounts']
    headerSamples: FormState['headerSamples']
    propertiesMap: FormState['propertiesMap']
  }>({
    action: route('contacts_import', { audienceId: audience.id }),
    onSuccess({ payload }) {
      setFormState((current) => ({
        ...current,
        contactImportId: payload.id,
        headerCounts: payload.headerCounts,
        propertiesMap: payload.propertiesMap,
        headerSamples: payload.headerSamples,
      }))

      setUploadProgress(0)
      setStep((current) => current + 1)
    },
    onProgress({ percent }) {
      setUploadProgress(percent)
    },
  })

  function onCsvFileAccepted() {
    const form = formRef.current

    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  }

  function onContinue() {
    setStep((current) => current + 1)
  }

  return (
    <div className="pt-10 lg:pt-24">
      <Dialog.Title asChild className="text-center">
        <Heading className="font-display kb-content-brand text-2xl mb-4">
          Upload contacts list
        </Heading>
      </Dialog.Title>

      <Dialog.Description asChild>
        <Text as="p">
          By proceeding, you confirm that everyone on the list has given permission to be
          emailed and is fully signed up. We trust that you've received consent, so no
          confirmation emails will be sent to your imported contacts.
        </Text>
      </Dialog.Description>

      <ServerForm {...serverFormProps} ref={formRef}>
        <div className="mt-6">
          <FileUploadDropbox
            isFileUploadingToServer={isPending}
            fileUploadProgress={uploadProgress}
            onFileAccept={onCsvFileAccepted}
            accept={['.csv']}
          />
          {error?.errorsList && error?.errorsList.length > 0 ? (
            <div className="mt-2">
              {error?.errorsList.map((error, idx) => (
                <InputError baseId={'csv-file-upload'} key={error}>
                  {error}
                </InputError>
              ))}
            </div>
          ) : null}
        </div>
      </ServerForm>

      <div className="mt-6 flex items-center justify-between">
        <Dialog.Close asChild>
          <Button variant="tertiary">Skip for now</Button>
        </Dialog.Close>

        <Button onClick={onContinue} loading={isPending}>
          Continue
        </Button>
      </div>
    </div>
  )
}
