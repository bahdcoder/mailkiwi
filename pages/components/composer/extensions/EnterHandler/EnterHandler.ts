import { Extension } from "@tiptap/core"
import { keymap } from "@tiptap/pm/keymap"

export const EnterHandler = Extension.create({
  name: "enterHandler",

  addProseMirrorPlugins() {
    return [
      keymap({
        Enter: (state, dispatch) => {
          const { $from, empty } = state.selection
          const currentNode = $from.node()

          // Don't interfere with non-empty selections
          if (!empty) {
            return false
          }

          // Don't interfere with special nodes (like codeBlock, lists, etc)
          if (!["paragraph", "heading"].includes(currentNode.type.name)) {
            return false
          }

          // Don't interfere if node has no styles
          if (
            !currentNode.attrs.styles ||
            Object.keys(currentNode.attrs.styles).length === 0
          ) {
            return false
          }

          // If we're at the end of the node, create a new paragraph
          const isAtEnd = $from.parentOffset === currentNode.nodeSize - 2

          if (!isAtEnd) {
            return false
          }

          // If the current node is empty, remove styles instead of creating new node
          if (currentNode.content.size === 0) {
            if (dispatch) {
              const tr = state.tr.setNodeMarkup($from.before(), currentNode.type, {
                styles: {},
              })
              dispatch(tr)
            }
            return true
          }

          // Create a new paragraph with empty styles
          const newParagraph = state.schema.nodes.paragraph.create({
            styles: {},
          })

          if (dispatch) {
            const tr = state.tr.replaceSelectionWith(newParagraph)
            dispatch(tr)
          }

          return true
        },
      }),
    ]
  },
})
