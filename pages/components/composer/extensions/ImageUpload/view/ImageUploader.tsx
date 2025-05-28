import { CloudUploadIcon } from '#root/pages/components/icons/cloud-upload.svg.jsx'
import { cn } from '#root/pages/components/tiptap/utils/index.js'
import { Spinner } from '@kibamail/owly/spinner'
import { Text } from '@kibamail/owly/text'
import { type ChangeEvent, useCallback } from 'react'
import { useDropZone, useFileUpload, useUploader } from './hooks.js'

export const ImageUploader = ({
  onUpload,
}: {
  onUpload: (url: string) => void
}) => {
  const { loading, uploadFile } = useUploader({ onUpload })
  const { handleUploadClick, ref } = useFileUpload()
  const { draggedInside, onDrop, onDragEnter, onDragLeave } = useDropZone({
    uploader: uploadFile,
  })

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      e.target.files ? uploadFile(e.target.files[0]) : null,
    [uploadFile],
  )

  return (
    <div
      className={cn(
        'flex flex-col items-center border border-dashed kb-border-secondary justify-center px-8 py-10 rounded-lg bg-opacity-80 kb-background-hover h-72',
        {
          'bg-neutral-100': draggedInside,
        },
      )}
      onDrop={onDrop}
      onDragOver={onDragEnter}
      onDragLeave={onDragLeave}
      contentEditable={false}
    >
      {loading ? (
        <>
          <Spinner size="lg" />
        </>
      ) : (
        <>
          <CloudUploadIcon className="w-6 h-6 mb-2 kb-content-tertiary" />
          <div className="flex flex-col items-center justify-center gap-1">
            <Text size="lg" className="kb-content-primary font-semibold">
              {draggedInside ? 'Drop image here' : 'Drag and drop an image or gif'}
            </Text>
            <div>
              <button type="button" disabled={draggedInside} onClick={handleUploadClick}>
                <Text className="kb-content-secondary">or select from your device.</Text>
              </button>
            </div>
          </div>
          <input
            className="w-0 h-0 overflow-hidden opacity-0"
            ref={ref}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif"
            onChange={onFileChange}
          />
        </>
      )}
    </div>
  )
}

export default ImageUploader
