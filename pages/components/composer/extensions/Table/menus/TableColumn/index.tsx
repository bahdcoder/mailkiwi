import type {
  MenuProps,
  ShouldShowProps,
} from '#root/pages/components/tiptap/menus/types.js'
import { Icon } from '#root/pages/components/tiptap/ui/Icon.jsx'
import * as PopoverMenu from '#root/pages/components/tiptap/ui/PopoverMenu.jsx'
import { Toolbar } from '#root/pages/components/tiptap/ui/Toolbar.jsx'
import { BubbleMenu as BaseBubbleMenu } from '@tiptap/react'
import React, { useCallback } from 'react'
import { isColumnGripSelected } from './utils.js'

export const TableColumnMenu = React.memo(
  ({ editor, appendTo }: MenuProps): JSX.Element => {
    const shouldShow = useCallback(
      ({ view, state, from }: ShouldShowProps) => {
        if (!state) {
          return false
        }

        return isColumnGripSelected({ editor, view, state, from: from || 0 })
      },
      [editor],
    )

    const onAddColumnBefore = useCallback(() => {
      editor.chain().focus().addColumnBefore().run()
    }, [editor])

    const onAddColumnAfter = useCallback(() => {
      editor.chain().focus().addColumnAfter().run()
    }, [editor])

    const onDeleteColumn = useCallback(() => {
      editor.chain().focus().deleteColumn().run()
    }, [editor])

    return (
      <BaseBubbleMenu
        editor={editor}
        pluginKey="tableColumnMenu"
        updateDelay={0}
        tippyOptions={{
          appendTo: appendTo?.current || 'parent',
          offset: [0, 15],
          popperOptions: {
            modifiers: [{ name: 'flip', enabled: false }],
          },
        }}
        shouldShow={shouldShow}
      >
        <Toolbar.Wrapper isVertical>
          <PopoverMenu.Item
            iconComponent={<Icon name="ArrowLeftToLine" />}
            close={false}
            label="Add column before"
            onClick={onAddColumnBefore}
          />
          <PopoverMenu.Item
            iconComponent={<Icon name="ArrowRightToLine" />}
            close={false}
            label="Add column after"
            onClick={onAddColumnAfter}
          />
          <PopoverMenu.Item
            icon="Trash"
            close={false}
            label="Delete column"
            onClick={onDeleteColumn}
          />
        </Toolbar.Wrapper>
      </BaseBubbleMenu>
    )
  },
)

TableColumnMenu.displayName = 'TableColumnMenu'

export default TableColumnMenu
