import { ImageUploader } from './ImageUploader.jsx'
import { FileUploadDropbox } from '@/pages/components/file-upload/file-upload-dropbox.jsx'
import {
  ServerForm,
  useServerFormMutation,
} from '@/pages/components/server-form-mutation/hooks/use-server-form-mutation.jsx'
import { type Editor, NodeViewWrapper } from '@tiptap/react'
import React, { useCallback, useRef } from 'react'

import { route } from '@/shared/routes/route_aliases.js'

export const ImageUpload = ({
  getPos,
  editor,
}: {
  getPos: () => number
  editor: Editor
}) => {
  const formRef = useRef<HTMLFormElement | null>(null)
  const [uploadProgress, setUploadProgress] = React.useState(0)

  const onUpload = useCallback(
    (url: string) => {
      if (url) {
        editor
          .chain()
          .setImageBlock({ src: url })
          .deleteRange({ from: getPos(), to: getPos() })
          .focus()
          .run()
      }
    },
    [getPos, editor],
  )

  const { serverFormProps, isPending, ServerErrorsList } = useServerFormMutation<{
    url: string
  }>({
    action: route('add_media_documents'),
    onSuccess({ payload }) {
      onUpload(payload.url)
      setUploadProgress(0)
    },
    onProgress({ percent }) {
      setUploadProgress(percent)
    },
  })

  function onFileAccepted() {
    const form = formRef.current

    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  }

  return (
    <NodeViewWrapper>
      <div className="p-0 m-0" data-drag-handle>
        <ServerForm ref={formRef} {...serverFormProps}>
          <FileUploadDropbox
            isFileUploadingToServer={isPending}
            fileUploadProgress={uploadProgress}
            onFileAccept={onFileAccepted}
            accept={['.png', '.jpg', '.gif', '.jpeg']}
          />
          {ServerErrorsList ? <div className="my-4">{ServerErrorsList}</div> : null}
        </ServerForm>
      </div>
    </NodeViewWrapper>
  )
}

export default ImageUpload
