import { LinkEditorPanel, linkPresets } from "./link-editor-panel.jsx"
import { ToolbarButton } from "@/pages/components/composer/components/toolbar/toolbar.jsx"
import { ToolbarContainer } from "@/pages/components/composer/components/toolbar/toolbar.jsx"
import { EditPencilIcon } from "@/pages/components/icons/edit-pencil.svg.jsx"
import { TrashIcon } from "@/pages/components/icons/trash.svg.jsx"
import { MenuProps } from "@/pages/components/tiptap/menus/types.js"
import { Text } from "@kibamail/owly/text"
import { BubbleMenu as BaseBubbleMenu, useEditorState } from "@tiptap/react"
import React, { useCallback, useState } from "react"

export const LinkMenu = ({ editor, appendTo }: MenuProps): JSX.Element => {
  const { link, target } = useEditorState({
    editor,
    selector: (ctx) => {
      const attrs = ctx.editor.getAttributes("link")
      return { link: attrs.href as string, target: attrs.target }
    },
  })

  const shouldShow = useCallback(() => {
    const isActive = editor.isActive("link")
    return isActive
  }, [editor])

  const onUnsetLink = useCallback(() => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run()

    return null
  }, [editor])

  const presetLink = linkPresets.find((preset) => preset.value === link)

  return (
    <BaseBubbleMenu
      editor={editor}
      pluginKey="linkMenu"
      shouldShow={shouldShow}
      updateDelay={0}
      tippyOptions={{
        popperOptions: {
          modifiers: [{ name: "flip", enabled: false }],
        },
        appendTo() {
          return appendTo?.current
        },
      }}
    >
      <ToolbarContainer>
        <div className="flex items-center px-2 border-r border-[var(--white-10)]">
          {presetLink ? (
            <p className="text-white text-sm">{presetLink?.name}</p>
          ) : (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer text-white underline underline-offset-2 decoration-[var(--content-tertiary-inverse)]"
            >
              <Text className="text-white">{link}</Text>
            </a>
          )}
        </div>
        <LinkEditorPanel editor={editor} initialUrl={link}>
          <button className="hover:text-white">
            <EditPencilIcon className="w-4 h-4" />
          </button>
        </LinkEditorPanel>

        <ToolbarButton onClick={onUnsetLink}>
          <TrashIcon className="w-4 h-4" />
        </ToolbarButton>
      </ToolbarContainer>
    </BaseBubbleMenu>
  )
}

export default LinkMenu
