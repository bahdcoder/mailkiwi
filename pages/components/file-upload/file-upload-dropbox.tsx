import {
  type UseFileUploadProps,
  useFileUpload,
} from '#root/pages/components/file-upload/hooks/use_file_upload.js'
import { CloudUploadIcon } from '#root/pages/components/icons/cloud-upload.svg.jsx'
import { Button } from '@kibamail/owly/button'
import { InputError } from '@kibamail/owly/input-hint'
import { Progress } from '@kibamail/owly/progress'
import { Text } from '@kibamail/owly/text'
import React from 'react'

type FileUploadDropboxProps = UseFileUploadProps & {
  isFileUploadingToServer?: boolean
  fileUploadProgress?: number
  accept?: string[]
}

export function FileUploadDropbox({
  isFileUploadingToServer,
  fileUploadProgress,
  accept,
  ...props
}: FileUploadDropboxProps) {
  const { state, getRootProps, getDropzoneProps, getHiddenInputProps } = useFileUpload({
    ...props,
    accept,
    maxFiles: 1,
    isDisabled: isFileUploadingToServer,
    allowDrop: !isFileUploadingToServer,
  })

  return (
    <div className="w-full" {...getRootProps()}>
      <div
        {...getDropzoneProps()}
        className="w-full h-72 rounded-3xl kb-background-hover border border-dashed kb-border-secondary data-dragging:border-(--border-focus) data-dragging:bg-(--background-info-subtle) transition-[border,background] ease-in-out flex items-center justify-center flex-col"
      >
        <CloudUploadIcon />

        <Text size="lg" className="font-semibold">
          {isFileUploadingToServer ? 'Uploading...' : 'Drag and drop your file here'}
        </Text>
        {isFileUploadingToServer ? (
          <div className="w-full max-w-xs flex mt-2 flex-col items-center">
            <Progress value={fileUploadProgress} />

            <Text className="mt-1 kb-content-tertiary">
              {isFileUploadingToServer && fileUploadProgress === 100
                ? 'Finishing upload...'
                : `${fileUploadProgress}%`}
            </Text>
          </div>
        ) : (
          <Button
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
          You seem to have uploaded an invalid file. Please upload only a file with
          extension ${accept?.join(',')}.
        </InputError>
      ) : null}

      <input {...getHiddenInputProps()} name="file" />
    </div>
  )
}
