import { EnterHandler } from "./extensions/EnterHandler/EnterHandler.js"
import { Button } from "@/pages/components/composer/extensions/Button/Button.js"
import { Container } from "@/pages/components/composer/extensions/Container/Container.js"
import { NodeStyles } from "@/pages/components/composer/extensions/NodeStyles/NodeStyles.js"
import { ExtensionKit } from "@/pages/components/composer/extensions/extension-kit.js"
import { TrailingNode } from "@/pages/components/composer/extensions/index.js"
import { useEditor } from "@tiptap/react"

export function useTiptapEditor() {
  const editor = useEditor({
    autofocus: true,
    extensions: [
      // Document,
      // Text,
      // Heading,
      // Paragraph,
      ...ExtensionKit(),
      NodeStyles,
      EnterHandler,
      Container,
      Button,
      TrailingNode,
    ],

    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        class: "min-h-full focus:outline-none",
      },
      handleDOMEvents: {
        keydown(_view, event) {
          // prevent default event listeners from firing when slash command is active
          if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
            const slashCommand = document.querySelector("#slash-command")
            if (slashCommand) {
              return true
            }
          }
        },
      },
    },
  })

  return {
    editor,
  }
}
