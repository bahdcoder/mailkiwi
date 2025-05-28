import { LinkEditorPanel } from '#root/pages/components/composer/components/link-menu/link-editor-panel.jsx'
import { ContentTypeSelector } from '#root/pages/components/composer/components/text-menu/content-type-selector.jsx'
import { FontSizePanel } from '#root/pages/components/composer/components/text-menu/font-size-panel.jsx'
import { TextColorPanel } from '#root/pages/components/composer/components/text-menu/text-color-panel.jsx'
import {
  ToolbarButton,
  ToolbarContainer,
  ToolbarSection,
} from '#root/pages/components/composer/components/toolbar/toolbar.jsx'
import { BoldIcon } from '#root/pages/components/icons/bold.svg.jsx'
import { CodeBlockIcon } from '#root/pages/components/icons/codeblock.svg.jsx'
import { ItalicIcon } from '#root/pages/components/icons/italic.svg.jsx'
import { LinkIcon } from '#root/pages/components/icons/link.svg.jsx'
import { UnderlineIcon } from '#root/pages/components/icons/underline.svg.jsx'
import type { ShouldShowProps } from '#root/pages/components/tiptap/menus/types.js'
import { BubbleMenu, type Editor } from '@tiptap/react'
import type React from 'react'
import type { Props as TippyProps } from 'tippy.js'

export interface TextMenuProps {
  editor: Editor
  pluginKey: string
  tippyProps?: Partial<TippyProps>
  shouldShow: ({ view, from }: ShouldShowProps) => boolean
}

type TextMenuAction = {
  id: string
  name: string
  icon: React.ReactNode
  command: (editor: Editor) => void
  hidden?: (editor: Editor) => boolean
  isActive: (editor: Editor) => boolean
}

export const textMenuActions: TextMenuAction[] = [
  {
    id: 'bold',
    name: 'Bold',
    icon: <BoldIcon className="w-4 h-4" />,
    command(editor) {
      return editor.chain().focus().toggleBold().run()
    },
    isActive(editor) {
      return editor.isActive('bold')
    },
  },
  {
    id: 'italic',
    name: 'Italic',
    icon: <ItalicIcon className="w-4 h-4" />,
    isActive(editor) {
      return editor.isActive('italic')
    },
    command(editor) {
      return editor.chain().focus().toggleItalic().run()
    },
  },
  {
    id: 'underline',
    name: 'Underline',
    icon: <UnderlineIcon className="w-[17px] h-[17px]" />,
    command(editor) {
      return editor.chain().focus().toggleUnderline().run()
    },
    isActive(editor) {
      return editor.isActive('underline')
    },
  },
  {
    id: 'code',
    name: 'Code',
    icon: <CodeBlockIcon className="w-4 h-4" />,
    command(editor) {
      editor
        .chain()
        .focus()
        .toggleCode()
        .updateAttributes('code', {
          styles: {
            'background-color': 'var(--black-5)',
            color: 'var(--content-primary)',
            'border-radius': '4px',
            padding: '2px 4px',
            'font-family': 'monospace',
          },
        })
        .run()
    },
    hidden(editor) {
      return editor.isActive('button')
    },
    isActive(editor) {
      return editor.isActive('code')
    },
  },
]

export function TextMenu({ editor, pluginKey, tippyProps, shouldShow }: TextMenuProps) {
  const isInsideButton = editor.isActive('button')

  if (!editor) {
    return null
  }

  function onValidUrlSubmitted(href: string) {
    editor.chain().focus().setLink({ href }).run()
  }

  return (
    <BubbleMenu
      editor={editor}
      pluginKey={pluginKey}
      shouldShow={shouldShow}
      tippyOptions={tippyProps}
    >
      <ToolbarContainer>
        {isInsideButton ? null : (
          <div className="flex box-border border-r border-(--white-10) pr-1">
            <ContentTypeSelector editor={editor} />
          </div>
        )}

        {textMenuActions
          .filter((action) =>
            action?.hidden === undefined ? true : !action?.hidden(editor),
          )
          .map((action) => (
            <ToolbarButton
              key={action.name}
              aria-label={action.name}
              isActive={action.isActive(editor)}
              onClick={() => action.command(editor)}
            >
              {action.icon}
            </ToolbarButton>
          ))}

        <ToolbarSection divider="left">
          <TextColorPanel editor={editor} />
        </ToolbarSection>

        <ToolbarSection divider="left">
          <FontSizePanel editor={editor} />
        </ToolbarSection>

        {isInsideButton ? null : (
          <div className="flex box-border border-l border-(--white-10) px-1">
            <LinkEditorPanel onSubmit={onValidUrlSubmitted}>
              <button type="button">
                <LinkIcon className="w-4 h-4" />
              </button>
            </LinkEditorPanel>
          </div>
        )}
      </ToolbarContainer>
    </BubbleMenu>
  )
}
