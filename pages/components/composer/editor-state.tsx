import { Button } from '#root/pages/components/composer/extensions/Button/Button.js'
import { Container } from '#root/pages/components/composer/extensions/Container/Container.js'
import { NodeStyles } from '#root/pages/components/composer/extensions/NodeStyles/NodeStyles.js'
import { ExtensionKit } from '#root/pages/components/composer/extensions/extension-kit.js'
import { TrailingNode } from '#root/pages/components/composer/extensions/index.js'
import { type UseEditorOptions, useEditor } from '@tiptap/react'
import { EnterHandler } from './extensions/EnterHandler/EnterHandler.js'

export function useTiptapEditor(moreEditorProps?: UseEditorOptions) {
  const editor = useEditor({
    autofocus: true,
    extensions: [
      ...ExtensionKit(),
      NodeStyles,
      EnterHandler,
      Container,
      Button,
      TrailingNode,
    ],

    editorProps: {
      attributes: {
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        class: 'min-h-full focus:outline-none',
      },
      handleDOMEvents: {
        keydown(_view, event) {
          // prevent default event listeners from firing when slash command is active
          if (['ArrowUp', 'ArrowDown', 'Enter'].includes(event.key)) {
            const slashCommand = document.querySelector('#slash-command')
            if (slashCommand) {
              return true
            }
          }
        },
      },
    },
    ...moreEditorProps,
  })

  return {
    editor,
  }
}
