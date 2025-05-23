import { LinkEditorPanel } from '#root/pages/components/composer/components/link-menu/link-editor-panel.jsx'
import {
  ToolbarButton,
  ToolbarContainer,
  ToolbarSection,
} from '#root/pages/components/composer/components/toolbar/toolbar.jsx'
import { EditImageInformationPanel } from '#root/pages/components/composer/extensions/ImageBlock/components/edit-image-information-panel.jsx'
import { CompAlignCenterIcon } from '#root/pages/components/icons/comp-align-center.svg.jsx'
import { CompAlignLeftIcon } from '#root/pages/components/icons/comp-align-left.svg.jsx'
import { CompAlignRightIcon } from '#root/pages/components/icons/comp-align-right.svg.jsx'
import { EditPencilIcon } from '#root/pages/components/icons/edit-pencil.svg.jsx'
import { LinkIcon } from '#root/pages/components/icons/link.svg.jsx'
import { TrashIcon } from '#root/pages/components/icons/trash.svg.jsx'
import type { MenuProps } from '#root/pages/components/tiptap/menus/types.js'
import { getRenderContainer } from '#root/pages/components/tiptap/utils/index.js'
import { BubbleMenu as BaseBubbleMenu, useEditorState } from '@tiptap/react'
import React, { useCallback, useRef } from 'react'
import { type Instance, sticky } from 'tippy.js'
import { v4 as uuid } from 'uuid'
import { ImageBlockWidth } from './ImageBlockWidth.js'

export const ImageBlockMenu = ({ editor, appendTo }: MenuProps): JSX.Element => {
  const menuRef = useRef<HTMLDivElement>(null)
  const tippyInstance = useRef<Instance | null>(null)

  const getReferenceClientRect = useCallback(() => {
    const renderContainer = getRenderContainer(editor, 'node-imageBlock')
    const rect =
      renderContainer?.getBoundingClientRect() || new DOMRect(-1000, -1000, 0, 0)

    return rect
  }, [editor])

  const shouldShow = useCallback(() => {
    const isActive = editor.isActive('imageBlock')

    return isActive
  }, [editor])

  const onAlignImageLeft = useCallback(() => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .setImageBlockAlign('left')
      .run()
  }, [editor])

  const onAlignImageCenter = useCallback(() => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .setImageBlockAlign('center')
      .run()
  }, [editor])

  const onAlignImageRight = useCallback(() => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .setImageBlockAlign('right')
      .run()
  }, [editor])

  const onWidthChange = useCallback(
    (value: number) => {
      editor
        .chain()
        .focus(undefined, { scrollIntoView: false })
        .setImageBlockWidth(value)
        .run()
    },
    [editor],
  )
  const { isImageCenter, isImageLeft, isImageRight, width } = useEditorState({
    editor,
    selector: (ctx) => {
      return {
        isImageLeft: ctx.editor.isActive('imageBlock', { align: 'left' }),
        isImageCenter: ctx.editor.isActive('imageBlock', { align: 'center' }),
        isImageRight: ctx.editor.isActive('imageBlock', { align: 'right' }),
        width: Number.parseInt(ctx.editor.getAttributes('imageBlock')?.width || 0),
      }
    },
  })

  function onDeleteNode() {
    const { state } = editor
    const pos = state.selection.$anchor.pos
    const node = state.doc.nodeAt(pos)

    if (node?.type.name === 'imageBlock') {
      editor
        .chain()
        .focus()
        .setNodeSelection(pos)
        .command(({ tr }) => {
          tr.delete(pos, pos + node.nodeSize)
          return true
        })
        .run()
    }
  }

  return (
    <BaseBubbleMenu
      editor={editor}
      pluginKey={`imageBlockMenu-${uuid()}`}
      shouldShow={shouldShow}
      updateDelay={0}
      tippyOptions={{
        offset: [0, 8],
        popperOptions: {
          modifiers: [{ name: 'flip', enabled: false }],
        },
        getReferenceClientRect,
        onCreate: (instance: Instance) => {
          tippyInstance.current = instance
        },
        appendTo: appendTo?.current || 'parent',
        plugins: [sticky],
        sticky: 'popper',
        maxWidth: 'calc(100vw - 16px)',
      }}
    >
      <ToolbarContainer>
        <ToolbarSection divider="right">
          <LinkEditorPanel>
            <button type="button">
              <LinkIcon className="w-4 h-4" />
            </button>
          </LinkEditorPanel>
        </ToolbarSection>
        <ToolbarSection divider="right">
          <EditImageInformationPanel editor={editor} />
        </ToolbarSection>
        <ToolbarSection divider="right">
          <ToolbarButton isActive={isImageLeft} onClick={onAlignImageLeft}>
            <CompAlignLeftIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton isActive={isImageCenter} onClick={onAlignImageCenter}>
            <CompAlignCenterIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton isActive={isImageRight} onClick={onAlignImageRight}>
            <CompAlignRightIcon className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarSection>
        <ToolbarSection divider="right">
          <ImageBlockWidth onChange={onWidthChange} value={width} />
        </ToolbarSection>
        <ToolbarSection divider="none">
          <ToolbarButton onClick={onDeleteNode}>
            <TrashIcon className="w-3 h-3" />
          </ToolbarButton>
        </ToolbarSection>
      </ToolbarContainer>
    </BaseBubbleMenu>
  )
}

export default ImageBlockMenu
