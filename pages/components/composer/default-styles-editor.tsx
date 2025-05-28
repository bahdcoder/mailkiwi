import { EditPencilIcon } from '#root/pages/components/icons/edit-pencil.svg.jsx'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Label } from '@kibamail/owly/text-field'
import cn from 'classnames'
import React from 'react'

export function DefaultStylesEditor() {
  const [editingDefaultStyles, setEditingDefaultStyles] = React.useState(false)

  return (
    <div
      className={cn('w-65 h-full border-l transition-[border-color]', {
        'kb-border-tertiary': editingDefaultStyles,
        'border-transparent': !editingDefaultStyles,
      })}
    >
      <div className="w-full flex justify-center py-2">
        <Button
          variant="tertiary"
          onClick={() => setEditingDefaultStyles((current) => !current)}
        >
          <EditPencilIcon />
          {editingDefaultStyles ? 'Hide default styles' : 'Edit default styles'}
        </Button>
      </div>

      {editingDefaultStyles ? (
        <div className="flex flex-col px-3">
          <Heading className="text-left kb-r-variant-display text-lg" variant="heading">
            Container
          </Heading>
        </div>
      ) : null}
      {/* <BlockEditor editor={editor as Editor} /> */}
    </div>
  )
}
