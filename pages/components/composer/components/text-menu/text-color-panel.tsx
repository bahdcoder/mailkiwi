import {
  FillPanel,
  type FillValue,
} from '#root/pages/components/composer/components/fill-panel/fill-panel.jsx'
import {
  ToolbarButton,
  getToolbarClassNames,
} from '#root/pages/components/composer/components/toolbar/toolbar.jsx'
import { getDefaultStylesForNode } from '#root/pages/components/composer/themes/default-theme.js'
import { NavArrowDownIcon } from '#root/pages/components/icons/nav-arrow-down.svg.jsx'
import { Text } from '@kibamail/owly/text'
import type { Editor } from '@tiptap/core'
import cn from 'classnames'
import type React from 'react'

export interface TextColorPanelProps extends React.PropsWithChildren {
  editor: Editor
}

export function TextColorPanel({ editor }: TextColorPanelProps) {
  function onColorChanged(fill: FillValue) {
    editor.commands.setColor(
      fill.value ?? getDefaultStylesForNode('paragraph')?.styles?.color,
    )
  }

  const textColor = editor.getAttributes('textStyle')?.color

  return (
    <div className="flex items-center">
      <FillPanel onChange={onColorChanged} sideOffset={4} value={textColor}>
        <button type="button" className="flex items-center">
          <span
            className={cn(
              getToolbarClassNames(true),
              'w-5! h-5! border box-border border-(--content-tertiary-inverse)',
            )}
            style={{
              background: textColor ?? 'transparent',
            }}
          />
          <NavArrowDownIcon className="w-3 h-3 ml-1 text-white" />
        </button>
      </FillPanel>
    </div>
  )
}
