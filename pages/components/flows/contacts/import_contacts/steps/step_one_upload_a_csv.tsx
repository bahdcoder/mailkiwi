import { FormState, useImportcontactsContext } from "../state/import_contacts_context.jsx"
import {
  UseFileUploadProps,
  useFileUpload,
} from "@/pages/components/file-upload/hooks/useFileUploads.js"
import { CloudUploadIcon } from "@/pages/components/icons/cloud-upload.svg.jsx"
import {
  ServerForm,
  useServerFormMutation,
} from "@/pages/components/server-form-mutation/hooks/use-server-form-mutation.jsx"
import { Button } from "@kibamail/owly/button"
import { Heading } from "@kibamail/owly/heading"
import { InputError } from "@kibamail/owly/input-hint"
import { Progress } from "@kibamail/owly/progress"
import { Text } from "@kibamail/owly/text"
import * as Dialog from "@radix-ui/react-dialog"
import React, { useRef } from "react"

import { UpdateContactImportSettingsDto } from "@/audiences/dto/contact_imports/update_contact_import_settings_dto.js"

import { route } from "@/shared/routes/route_aliases.js"

export function StepOneUploadACsv() {
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const formRef = useRef<HTMLFormElement | null>(null)

  const { setFormState, step, setStep, audienceId } =
    useImportcontactsContext("UploadACsv")

  const { serverFormProps, isPending, error } = useServerFormMutation<{
    id: string
    headerCounts: FormState["headerCounts"]
    headerSamples: FormState["headerSamples"]
    propertiesMap: FormState["propertiesMap"]
  }>({
    action: route("contacts_import", { audienceId }),
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

    form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
  }

  function onContinue() {
    setStep((current) => current + 1)
  }

  return (
    <div className="pt-24">
      <Dialog.Title asChild className="text-center">
        <Heading>Upload subscriber list</Heading>
      </Dialog.Title>

      <Dialog.Description asChild>
        <Text as="p">
          By proceeding, you confirm that everyone on the list has given permission to be
          emailed and is fully signed up. We trust that you've received consent, so no
          confirmation emails will be sent.
        </Text>
      </Dialog.Description>

      <ServerForm {...serverFormProps} ref={formRef}>
        <div className="mt-6">
          <FileUploadDropbox
            isFileUploadingToServer={isPending}
            fileUploadProgress={uploadProgress}
            onFileAccept={onCsvFileAccepted}
          />
          {error?.errorsList && error?.errorsList.length > 0 ? (
            <div className="mt-2">
              {error?.errorsList.map((error, idx) => (
                <InputError baseId={"csv-file-upload"} key={idx}>
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

        <Button onClick={onContinue}>Continue</Button>
      </div>
    </div>
  )
}

type FileUploadDropboxProps = UseFileUploadProps & {
  isFileUploadingToServer?: boolean
  fileUploadProgress?: number
}

function FileUploadDropbox({
  isFileUploadingToServer,
  fileUploadProgress,
  ...props
}: FileUploadDropboxProps) {
  const { state, getRootProps, getDropzoneProps, getHiddenInputProps, getTriggerProps } =
    useFileUpload({
      ...props,
      accept: [".csv"],
      maxFiles: 1,
      isDisabled: isFileUploadingToServer,
      allowDrop: !isFileUploadingToServer,
    })

  return (
    <div className="w-full" {...getRootProps()}>
      <div
        {...getDropzoneProps()}
        className="w-full h-72 rounded-3xl kb-background-hover border border-dashed kb-border-secondary data-[dragging]:border-[var(--border-focus)] data-[dragging]:bg-[var(--background-info-subtle)] transition-[border,background] ease-in-out flex items-center justify-center flex-col"
      >
        <CloudUploadIcon />

        <Text size="lg" className="font-semibold">
          {isFileUploadingToServer ? "Uploading..." : "Drag and drop your file here"}
        </Text>
        {isFileUploadingToServer ? (
          <div className="w-full max-w-xs flex mt-2 flex-col items-center">
            <Progress value={fileUploadProgress} />

            <Text className="mt-1 kb-content-tertiary">{fileUploadProgress}%</Text>
          </div>
        ) : (
          <Button
            {...getTriggerProps()}
            variant="tertiary"
            type="button"
            className="kb-content-tertiary -mt-0.5"
          >
            or click here to select from your device
          </Button>
        )}
      </div>

      {state.rejectedFiles.length > 0 ? (
        <InputError baseId="file-upload-error" className="mt-2">
          You seem to have uploaded an invalid file. Please upload only a valid CSV file.
        </InputError>
      ) : null}

      <input {...getHiddenInputProps()} name="file" />
    </div>
  )
}
