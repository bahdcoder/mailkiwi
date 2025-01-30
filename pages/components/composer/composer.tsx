import "./composer.styles.css"
import { useTiptapEditor } from "./editor-state.jsx"
import { useTextMenuState } from "@/maily/packages/core/src/editor/components/text-menu/use-text-menu-state.jsx"
import { BlockEditor } from "@/pages/components/composer/block-editor.jsx"
import LinkMenu from "@/pages/components/composer/components/link-menu/link-menu.jsx"
import { TextMenu } from "@/pages/components/composer/components/text-menu/text-menu.jsx"
import { useTextmenuStates } from "@/pages/components/composer/components/text-menu/use-text-menu-states.js"
import { ButtonMenu } from "@/pages/components/composer/extensions/Button/button-menu.jsx"
import ImageBlockMenu from "@/pages/components/composer/extensions/ImageBlock/components/ImageBlockMenu.jsx"
import { ShouldShowProps } from "@/pages/components/tiptap/menus/types.js"
import isCustomNodeSelected from "@/pages/components/tiptap/utils/isCustomNodeSelected.js"
import isTextSelected from "@/pages/components/tiptap/utils/isTextSelected.js"
import * as Tabs from "@kibamail/owly/tabs"
import { Editor, EditorContent } from "@tiptap/react"
import React, { useCallback } from "react"

interface ComposerMenusProps {
  editor: Editor
  container: React.MutableRefObject<HTMLDivElement | null>
}

function ComposerMenus({ editor, container }: ComposerMenusProps) {
  const { shouldShow } = useTextmenuStates(editor)

  const shouldShowTextMenu = useCallback(
    ({ view, from }: ShouldShowProps) => {
      return shouldShow({ view, from }) && !editor.isActive("button")
    },
    [editor],
  )

  const shouldShowNodeTextEditingMenu = useCallback(
    ({ view, from }: ShouldShowProps) => {
      // TODO: Add more conditions for other blocks like container, columns, etc
      return shouldShow({ view, from }) && editor.isActive("button")
    },
    [editor],
  )

  return (
    <>
      <TextMenu
        editor={editor}
        pluginKey="textMenu"
        shouldShow={shouldShowTextMenu}
        tippyProps={{ placement: "top" }}
      />
      <ButtonMenu editor={editor} appendTo={container} />
      <TextMenu
        editor={editor}
        pluginKey="buttonTextMenu"
        tippyProps={{ placement: "bottom" }}
        shouldShow={shouldShowNodeTextEditingMenu}
      />
      <LinkMenu editor={editor} appendTo={container} />
      <ImageBlockMenu editor={editor} appendTo={container} />
    </>
  )
}

export function Composer() {
  const { editor } = useTiptapEditor()

  const menuContainerRef = React.useRef<HTMLDivElement | null>(null)

  if (!editor) {
    return <p>Loading composer</p>
  }

  return (
    <div className="w-full flex items-center h-full">
      <div className="w-[16.25rem] h-full border-r kb-border-tertiary p-2">
        <Tabs.Root defaultValue="layers" width="full">
          <Tabs.List>
            <Tabs.TabsTrigger value="layers">Layers</Tabs.TabsTrigger>
            <Tabs.TabsTrigger value="blocks">Blocks</Tabs.TabsTrigger>
            <Tabs.Indicator />
          </Tabs.List>

          <Tabs.Content value="layers">Layers here</Tabs.Content>
          <Tabs.Content value="blocks">Blocks here</Tabs.Content>
        </Tabs.Root>
      </div>
      <div
        className="flex-grow h-full p-6 overflow-y-auto w-composer-inter"
        ref={menuContainerRef}
      >
        <div className="w-full max-w-[45rem] mx-auto h-full flex flex-col gap-2">
          {/* TODO: Make this an auto expandable textarea */}
          <textarea
            className="text-4xl font-bold text-[var(--content-secondary)] placeholder:text-[var(--content-tertiary-inverse)] bg-transparent border-none focus:outline-none focus:border-none w-full w-composer-inter resize-none"
            placeholder="Broadcast title"
          />

          <div className="w-full w-composer-content flex-grow p-8 bg-white shadow-[0px_16px_24px_-8px_var(--black-10)]">
            <ComposerMenus container={menuContainerRef} editor={editor} />
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
      <div className="w-[16.25rem] h-full border-l kb-border-tertiary">
        <BlockEditor editor={editor as Editor} />
      </div>
    </div>
  )
}
