import { getToolbarClassNames } from '#root/pages/components/composer/components/toolbar/toolbar.jsx'
import { TextSizeIcon } from '#root/pages/components/icons/text-size.svg.jsx'
import * as Popover from '#root/pages/components/popover/popover.jsx'
import { Slider } from '#root/pages/components/slider/slider.jsx'
import { Text } from '@kibamail/owly/text'
import { Label } from '@kibamail/owly/text-field'
import type { Editor } from '@tiptap/core'
import React from 'react'

export interface FontSizePanelProps {
  editor: Editor
}

export function FontSizePanel({ editor }: FontSizePanelProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const fontSize = editor.getAttributes('textStyle')?.fontSize?.split('px')?.[0] ?? '16'

  function onFontSizeChange(value: number[]) {
    editor.commands.setFontSize(`${value?.[0]}px`)
  }

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button type="button" className={getToolbarClassNames(false)}>
          <TextSizeIcon className="w-4 h-4" />
        </button>
      </Popover.Trigger>
      <Popover.Content align="center" className="w-64" sideOffset={8}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label>Font size</Label>
            <Text className="text-xs font-medium">{fontSize}px</Text>
          </div>
          <Slider value={[fontSize]} min={10} max={72} onValueChange={onFontSizeChange} />
        </div>
      </Popover.Content>
    </Popover.Root>
  )
}
