import {
  ToolbarButton,
  getToolbarClassNames,
} from '#root/pages/components/composer/components/toolbar/toolbar.jsx'
import { EditPencilIcon } from '#root/pages/components/icons/edit-pencil.svg.jsx'
import * as Popover from '#root/pages/components/popover/popover.jsx'
import * as TextField from '@kibamail/owly/text-field'
import type { Editor } from '@tiptap/core'
import React from 'react'

export interface EditImageInformationPanelProps {
  editor: Editor
}

export function EditImageInformationPanel({ editor }: EditImageInformationPanelProps) {
  const imageAttributes = editor.getAttributes('imageBlock')
  const [altText, setAltText] = React.useState(imageAttributes?.alt ?? '')

  function onAltTextChange(event: React.ChangeEvent<HTMLInputElement>) {
    setAltText(event.target.value)
  }

  function onFormSubmitted(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const alt = new FormData(event.target as HTMLFormElement).get('alt') as string

    editor.chain().focus().setImageBlockAlt(alt).run()
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" className={getToolbarClassNames(false)}>
          <EditPencilIcon className="w-4 h-4" />
        </button>
      </Popover.Trigger>
      <Popover.Content align="center" sideOffset={12} className="w-80">
        <form onSubmit={onFormSubmitted}>
          <div
            className="flex flex-col gap-3 py-2"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === 'Escape' && e.stopPropagation()}
          >
            <TextField.Root
              placeholder="Alt text"
              value={altText}
              onChange={onAltTextChange}
              name="alt"
            >
              <TextField.Label>Alt text</TextField.Label>
            </TextField.Root>
          </div>
        </form>
      </Popover.Content>
    </Popover.Root>
  )
}
