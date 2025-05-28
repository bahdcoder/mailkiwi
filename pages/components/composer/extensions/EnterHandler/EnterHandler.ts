import { getDefaultStylesForNode } from '#root/pages/components/composer/themes/default-theme.js'
import { Extension } from '@tiptap/core'
import { keymap } from '@tiptap/pm/keymap'

/**
 * This extension handles a unique scenario. when I hit enter on a heading, the next line creates a paragraph as expected, but copies all the styles from the heading to the new paragraph. to override that, with this "Enter" key handler, we'll intercept that behaviour and add the default paragraph styles instead.
 *
 *
 */

export const EnterHandler = Extension.create({
  name: 'enterHandler',

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

          const isInsideListItem =
            $from.depth > 0 && $from.node(-1).type.name === 'listItem'
          if (isInsideListItem) {
            return false
          }

          // Don't interfere with special nodes (like codeBlock, lists, etc)
          if (!['paragraph', 'heading'].includes(currentNode.type.name)) {
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

          if (dispatch) {
            const pos = $from.pos

            const tr = state.tr
              .split(pos)
              .setNodeMarkup(
                $from.after(),
                state.schema.nodes.paragraph,
                getDefaultStylesForNode('paragraph'),
              )
            dispatch(tr)
          }

          return true
        },
      }),
    ]
  },
})
