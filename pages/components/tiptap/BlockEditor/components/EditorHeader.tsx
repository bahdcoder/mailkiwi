import { Icon } from '#root/pages/components/tiptap/ui/Icon.jsx'
import { Toolbar } from '#root/pages/components/tiptap/ui/Toolbar.jsx'
import type { Editor } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'
import type { EditorUser } from '../types.jsx'
import { EditorInfo } from './EditorInfo.jsx'

export type EditorHeaderProps = {
  isSidebarOpen?: boolean
  toggleSidebar?: () => void
  editor: Editor
  users: EditorUser[]
}

export const EditorHeader = ({
  editor,
  users,
  isSidebarOpen,
  toggleSidebar,
}: EditorHeaderProps) => {
  const { characters, words } = useEditorState({
    editor,
    selector: (ctx): { characters: number; words: number } => {
      const { characters, words } = ctx.editor?.storage.characterCount || {
        characters: () => 0,
        words: () => 0,
      }
      return { characters: characters(), words: words() }
    },
  })

  return (
    <div className="flex flex-row items-center justify-between flex-none py-2 pl-6 pr-3 text-black bg-white border-b border-neutral-200 dark:bg-black dark:text-white dark:border-neutral-800">
      <div className="flex flex-row gap-x-1.5 items-center">
        <div className="flex items-center gap-x-1.5">
          <Toolbar.Button
            tooltip={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            onClick={toggleSidebar}
            active={isSidebarOpen}
            className={isSidebarOpen ? 'bg-transparent' : ''}
          >
            <Icon name={isSidebarOpen ? 'PanelLeftClose' : 'PanelLeft'} />
          </Toolbar.Button>
        </div>
      </div>
      <EditorInfo characters={characters} words={words} users={users} />
    </div>
  )
}
