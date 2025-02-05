import "./composer.styles.css"
import { useTiptapEditor } from "./editor-state.jsx"
import { useTextMenuState } from "@/maily/packages/core/src/editor/components/text-menu/use-text-menu-state.jsx"
import { BlockEditor } from "@/pages/components/composer/block-editor.jsx"
import LinkMenu from "@/pages/components/composer/components/link-menu/link-menu.jsx"
import { TextMenu } from "@/pages/components/composer/components/text-menu/text-menu.jsx"
import { useTextmenuStates } from "@/pages/components/composer/components/text-menu/use-text-menu-states.js"
import { DefaultStylesEditor } from "@/pages/components/composer/default-styles-editor.jsx"
import { ButtonMenu } from "@/pages/components/composer/extensions/Button/button-menu.jsx"
import { ContainerMenu } from "@/pages/components/composer/extensions/Container/container-menu.jsx"
import ImageBlockMenu from "@/pages/components/composer/extensions/ImageBlock/components/ImageBlockMenu.jsx"
import { ContentItemMenu } from "@/pages/components/composer/menus/ContentItemMenu/ContentItemMenu.jsx"
import { EditPencilIcon } from "@/pages/components/icons/edit-pencil.svg.jsx"
import { ShouldShowProps } from "@/pages/components/tiptap/menus/types.js"
import isCustomNodeSelected from "@/pages/components/tiptap/utils/isCustomNodeSelected.js"
import isTextSelected from "@/pages/components/tiptap/utils/isTextSelected.js"
import { Button } from "@kibamail/owly/button"
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
      <ContainerMenu editor={editor} appendTo={container} />
      {/* <ContentItemMenu editor={editor} /> */}
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
    <div className="w-full flex items-center justify-center h-full">
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
    </div>
  )
}
