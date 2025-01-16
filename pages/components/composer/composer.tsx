import { ComposerProvider, useTiptapEditor } from "./editor-state.jsx"
import { BlockEditor } from "@/pages/components/composer/block-editor.jsx"
import { TextMenu } from "@/pages/components/tiptap/menus/index.js"
import * as Tabs from "@kibamail/owly/tabs"
// import { TextMenu } from '../menus/TextMenu';
// import { ContentItemMenu } from '../menus/ContentItemMenu';
// import { EditorHeader } from './components/EditorHeader';
// import ImageBlockMenu from "@/extensions/ImageBlock/components/ImageBlockMenu"
// import { ColumnsMenu } from "@/extensions/MultiColumn/menus"
// import { TableColumnMenu, TableRowMenu } from "@/extensions/Table/menus"
// import { suggestions } from "@/pages/components/composer/extensions.jsx"
// import { SlashCmd, SlashCmdProvider } from "@harshtalks/slash-tiptap"
import { Editor, EditorContent, useEditorState } from "@tiptap/react"

export function ComposerContent() {
  const { editor } = useTiptapEditor()

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
      <div className="flex-grow h-full p-6 overflow-y-auto w-composer-inter">
        <div className="w-full max-w-[45rem] mx-auto h-full flex flex-col gap-2">
          {/* TODO: Make this an auto expandable textarea */}
          <textarea
            className="text-4xl font-bold text-[var(--content-secondary)] placeholder:text-[var(--content-tertiary-inverse)] bg-transparent border-none focus:outline-none focus:border-none w-full w-composer-inter resize-none"
            placeholder="Broadcast title"
          />

          <div className="w-full w-composer-content flex-grow p-8 bg-white shadow-[0px_16px_24px_-8px_var(--black-10)]">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
      <div className="w-[16.25rem] h-full border-l kb-border-tertiary">
        <BlockEditor />
      </div>
    </div>
  )
}

export function Composer() {
  return (
    <ComposerProvider>
      <ComposerContent />
    </ComposerProvider>
  )
}
