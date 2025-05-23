import type {
  MenuProps,
  ShouldShowProps,
} from '#root/pages/components/tiptap/menus/types.js'
import { Icon } from '#root/pages/components/tiptap/ui/Icon.jsx'
import * as PopoverMenu from '#root/pages/components/tiptap/ui/PopoverMenu.jsx'
import { Toolbar } from '#root/pages/components/tiptap/ui/Toolbar.jsx'
import { BubbleMenu as BaseBubbleMenu } from '@tiptap/react'
import React, { useCallback } from 'react'
import { isRowGripSelected } from './utils.js'

export const TableRowMenu = React.memo(({ editor, appendTo }: MenuProps): JSX.Element => {
  const shouldShow = useCallback(
    ({ view, state, from }: ShouldShowProps) => {
      if (!state || !from) {
        return false
      }

      return isRowGripSelected({ editor, view, state, from })
    },
    [editor],
  )

  const onAddRowBefore = useCallback(() => {
    editor.chain().focus().addRowBefore().run()
  }, [editor])

  const onAddRowAfter = useCallback(() => {
    editor.chain().focus().addRowAfter().run()
  }, [editor])

  const onDeleteRow = useCallback(() => {
    editor.chain().focus().deleteRow().run()
  }, [editor])

  return (
    <BaseBubbleMenu
      editor={editor}
      pluginKey="tableRowMenu"
      updateDelay={0}
      tippyOptions={{
        appendTo: appendTo?.current || 'parent',
        placement: 'left',
        offset: [0, 15],
        popperOptions: {
          modifiers: [{ name: 'flip', enabled: false }],
        },
      }}
      shouldShow={shouldShow}
    >
      <Toolbar.Wrapper isVertical>
        <PopoverMenu.Item
          iconComponent={<Icon name="ArrowUpToLine" />}
          close={false}
          label="Add row before"
          onClick={onAddRowBefore}
        />
        <PopoverMenu.Item
          iconComponent={<Icon name="ArrowDownToLine" />}
          close={false}
          label="Add row after"
          onClick={onAddRowAfter}
        />
        <PopoverMenu.Item
          icon="Trash"
          close={false}
          label="Delete row"
          onClick={onDeleteRow}
        />
      </Toolbar.Wrapper>
    </BaseBubbleMenu>
  )
})

TableRowMenu.displayName = 'TableRowMenu'

export default TableRowMenu
