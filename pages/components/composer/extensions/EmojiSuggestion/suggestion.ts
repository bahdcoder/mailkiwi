import type { Editor } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'
import type { RefAttributes } from 'react'
import tippy, { Instance as TippyInstance } from 'tippy.js'
import EmojiList from './components/EmojiList.jsx'
import type { EmojiListProps } from './types.js'

export const emojiSuggestion = {
  items: ({ editor, query }: { editor: Editor; query: string }) =>
    editor.storage.emoji.emojis
      .filter(
        ({ shortcodes, tags }: { shortcodes: string[]; tags: string[] }) =>
          shortcodes.find((shortcode) => shortcode.startsWith(query.toLowerCase())) ||
          tags.find((tag) => tag.startsWith(query.toLowerCase())),
      )
      .slice(0, 250),

  allowSpaces: false,

  render: () => {
    let component: ReactRenderer<
      { onKeyDown: (evt: SuggestionKeyDownProps) => boolean },
      EmojiListProps &
        RefAttributes<{ onKeyDown: (evt: SuggestionKeyDownProps) => boolean }>
    >
    // biome-ignore lint/suspicious/noExplicitAny: Because the tippy type imports don't work, we can't correctly define a suitable type here.
    let popup: any = null

    return {
      onStart: (props: SuggestionProps<unknown>) => {
        component = new ReactRenderer(EmojiList, {
          props,
          editor: props.editor,
        })

        // @ts-ignore
        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as () => DOMRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        })
      },

      onUpdate(props: SuggestionProps<unknown>) {
        component.updateProps(props)

        popup[0].setProps({
          getReferenceClientRect: props.clientRect as () => DOMRect,
        })
      },

      onKeyDown(props: SuggestionKeyDownProps) {
        if (props.event.key === 'Escape') {
          popup[0].hide()
          component.destroy()

          return true
        }

        return component.ref?.onKeyDown(props) ?? false
      },

      onExit() {
        popup[0].destroy()
        component.destroy()
      },
    }
  },
}

export default emojiSuggestion
