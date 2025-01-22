import "./composer.styles.css"
import { ComposerProvider, useTiptapEditor } from "./editor-state.jsx"
import { BlockEditor } from "@/pages/components/composer/block-editor.jsx"
import LinkMenu from "@/pages/components/composer/components/link-menu/link-menu.jsx"
import { TextMenu } from "@/pages/components/composer/components/text-menu/text-menu.jsx"
import { PlusIcon } from "@/pages/components/icons/plus.svg.jsx"
import { Button } from "@kibamail/owly/button"
import * as Tabs from "@kibamail/owly/tabs"
import { BubbleMenu, Editor, EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import React from "react"

export function Composer() {
  const { editor } = useTiptapEditor()

  const menuContainerRef = React.useRef<HTMLDivElement | null>(null)

  if (!editor) {
    return <p>Loading composer</p>
  }

  return (
    <div className="w-full flex items-center h-full">
      {false ? (
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
      ) : null}
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
            {/* <EditorContent editor={editor} />
            <TextMenu editor={editor} /> */}
            <TextMenu editor={editor} />
            <LinkMenu editor={editor} appendTo={menuContainerRef} />
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
      {false ? (
        <div className="w-[16.25rem] h-full border-l kb-border-tertiary">
          <BlockEditor editor={editor as Editor} />
        </div>
      ) : null}
    </div>
  )
}
