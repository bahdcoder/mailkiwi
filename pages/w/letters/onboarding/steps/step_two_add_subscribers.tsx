import { useOnboardingContext } from "./context_provider.jsx"
import { ButtonCard } from "@/pages/components/button/button-card.jsx"
import {
  UseFileUploadProps,
  useFileUpload,
} from "@/pages/components/file-upload/hooks/useFileUploads.js"
import { CancelIcon } from "@/pages/components/icons/cancel.svg.jsx"
import { CloudUploadIcon } from "@/pages/components/icons/cloud-upload.svg.jsx"
import {
  ServerForm,
  useServerFormMutation,
} from "@/pages/components/server-form-mutation/hooks/use-server-form-mutation.jsx"
import { Button } from "@kibamail/owly/button"
import { Heading } from "@kibamail/owly/heading"
import { InputError } from "@kibamail/owly/input-hint"
import { Text } from "@kibamail/owly/text"
import * as Dialog from "@radix-ui/react-dialog"
import React, { useRef } from "react"
import { usePageContext } from "vike-react/usePageContext"

import { route } from "@/shared/routes/route_aliases.js"

export function AddSubscribersStep() {
  const ctx = usePageContext()
  const formRef = useRef<HTMLFormElement | null>(null)
  const { step, setStep, formState } = useOnboardingContext("CreatePublicationStep")

  function goToNextStep() {
    setStep((current) => current + 1)
  }

  const { serverFormProps } = useServerFormMutation({
    action: route("contacts_import", { audienceId: formState.audienceId }),
  })

  if (step !== 1) {
    return null
  }

  function onCsvFileAccepted(_: { files: File[] }) {
    const form = formRef.current

    form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
  }

  return (
    <div>
      <Heading variant="display">Add subscribers</Heading>
      <Text className="kb-content-tertiary" as="label" htmlFor="slug">
        Bring your existing subscribers to your Kibamail Letters account.
      </Text>

      <div className="flex flex-col gap-y-4 mt-6">
        <ButtonCard>
          <Text size="lg" className="font-semibold">
            Add subscribers manually
          </Text>
          <Text>Add a single subscriber by entering their name and email.</Text>
        </ButtonCard>

        <Dialog.Root>
          <Dialog.Trigger asChild>
            <ButtonCard>
              <Text size="lg" className="font-semibold">
                Upload subscriber list
              </Text>
              <Text>Upload a csv to add multiple subscribers at once.</Text>
            </ButtonCard>
          </Dialog.Trigger>
          <Dialog.Portal>
            {/* <Dialog.Overlay className="DialogOverlay" /> */}
            <Dialog.Content className="DialogContent w-screen h-screen p-10 kb-background-secondary fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 focus:outline-none duration-300 ease-out [data-state='closed']:transform-[scale(95%)] [data-state='closed']:opacity-0 data-[state=open]:animate-[dialog-content-show_150ms_cubic-bezier(0.16,1,0.3,1)] data-[state=closed]:animate-[dialog-content-hide_100ms_cubic-bezier(0.16,1,0.3,1)]">
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

              <div className="w-full max-w-[40rem] mx-auto pt-24 grid grid-cols-1 gap-y-2">
                <Dialog.Title asChild className="text-center">
                  <Heading>Upload subscriber list</Heading>
                </Dialog.Title>

                <Dialog.Description asChild>
                  <Text as="p">
                    By proceeding, you confirm that everyone on the list has given
                    permission to be emailed and is fully signed up. We trust that you've
                    received consent, so no confirmation emails will be sent.
                  </Text>
                </Dialog.Description>

                <ServerForm {...serverFormProps} ref={formRef}>
                  <div className="mt-6">
                    <FileUploadDropbox onFileAccept={onCsvFileAccepted} />
                  </div>
                </ServerForm>
              </div>

              <div className="mt-6"></div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <Button variant="tertiary" className="mt-6" onClick={goToNextStep}>
        Skip for now
      </Button>
    </div>
  )
}

type FileUploadDropboxProps = UseFileUploadProps

function FileUploadDropbox({ ...props }: FileUploadDropboxProps) {
  const { state, getRootProps, getDropzoneProps, getHiddenInputProps, getTriggerProps } =
    useFileUpload({
      ...props,
      accept: [".csv"],
      maxFiles: 1,
    })

  return (
    <div className="w-full" {...getRootProps()}>
      <div
        {...getDropzoneProps()}
        className="w-full h-72 rounded-3xl kb-background-hover border border-dashed kb-border-secondary data-[dragging]:border-[var(--border-focus)] data-[dragging]:bg-[var(--background-info-subtle)] transition-[border,background] ease-in-out flex items-center justify-center flex-col"
      >
        <CloudUploadIcon />

        <Text size="lg" className="font-semibold">
          Drag and drop a csv file
        </Text>
        <Button
          {...getTriggerProps()}
          variant="tertiary"
          className="kb-content-tertiary -mt-1"
        >
          or click here to select from your device
        </Button>
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

function FileUploadComponent() {
  const {
    state,
    getRootProps,
    getDropzoneProps,
    getHiddenInputProps,
    getTriggerProps,
    getItemProps,
    getItemDeleteTriggerProps,
    getClearTriggerProps,
  } = useFileUpload({
    accept: [".csv"],
    maxFiles: 5,
    onFileChange: ({ acceptedFiles, rejectedFiles }) => {
      console.log("Accepted Files:", acceptedFiles)
      console.log("Rejected Files:", rejectedFiles)
    },
    onFileAccept: ({ files }) => console.log("Accepted Files:", files),
    onFileReject: ({ files }) => console.log("Rejected Files:", files),
  })

  return (
    <div className="p-6 max-w-md mx-auto">
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div {...getDropzoneProps()}>
          <p className="text-gray-500">
            Drag and drop CSV files here, or click to upload.
          </p>
        </div>
      </div>

      <input {...getHiddenInputProps()} />

      <button
        {...getTriggerProps()}
        className="mt-4 w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Upload Files
      </button>

      <button
        {...getClearTriggerProps()}
        className="mt-2 w-full px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        Clear All Files
      </button>

      <ul className="mt-4 space-y-3">
        {state.acceptedFiles.map((file, index) => (
          <li
            key={index}
            {...getItemProps(file)}
            className="flex items-center justify-between p-2 bg-gray-100 rounded-md border"
          >
            <span className="text-gray-700 text-sm">{file.name}</span>
            <button
              {...getItemDeleteTriggerProps(file)}
              className="text-red-600 hover:text-red-800 text-sm focus:outline-none"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {state.rejectedFiles.length > 0 && (
        <div className="mt-4 text-red-600">
          <p>Some files were rejected:</p>
          <ul className="list-disc list-inside">
            {state.rejectedFiles.map((file, index) => (
              <li key={index} className="text-sm">
                {file.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
