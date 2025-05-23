import { ButtonNodeView } from '#root/pages/components/composer/extensions/Button/button-node-view.jsx'
import {
  getStyleAttributeDefaultCommands,
  getStyleAttributeDefinition,
} from '#root/pages/components/composer/extensions/NodeStyles/NodeStyles.js'
import { getDefaultStylesForNode } from '#root/pages/components/composer/themes/default-theme.js'
import { Node, type NodeViewProps } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { ComponentType } from 'react'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    button: {
      setButton: (attributes: { href: string }) => ReturnType
      setButtonStyles: (key: string, value: string) => ReturnType
      removeButtonStyles: (key: string) => ReturnType
    }
  }
}

export const Button = Node.create({
  name: 'button',

  group: 'block', // Changed from 'inline' to 'block'

  content: 'text*', // Only allow text content

  isolating: true,

  defining: true,

  selectable: true,

  draggable: false,

  addAttributes() {
    return {
      href: {
        default: '',
      },
      styles: getStyleAttributeDefinition(
        getDefaultStylesForNode('button').styles as Record<
          string,
          string | number | boolean
        >,
      ),
    }
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-type="button"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['a', { 'data-type': 'button', ...HTMLAttributes }, 0]
  },

  addCommands() {
    return {
      setButton:
        (attributes) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                ...attributes,
                ...getDefaultStylesForNode('button'),
              },
              content: [
                {
                  type: 'text',
                  text: 'Click me',
                },
              ],
            })
            .run()
        },
      setButtonStyles: getStyleAttributeDefaultCommands().setNodeStyle,
      removeButtonStyles: getStyleAttributeDefaultCommands().removeNodeStyle,
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ButtonNodeView as ComponentType<NodeViewProps>)
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { $from, empty } = editor.state.selection

        // Only handle empty selections within button nodes
        if (!empty || $from.parent.type !== this.type) {
          return false
        }

        const isAtStart = $from.parentOffset === 0
        if (isAtStart) {
          return editor
            .chain()
            .insertContentAt($from.before(), {
              type: 'paragraph',
              attrs: getDefaultStylesForNode('paragraph'),
            })
            .setTextSelection($from.pos + 2)
            .run()
        }

        // Check if cursor is at the end of the button content
        const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2

        if (isAtEnd) {
          // Insert a new paragraph after the button
          return editor
            .chain()
            .insertContentAt($from.after(), {
              type: 'paragraph',
              attrs: getDefaultStylesForNode('paragraph'),
            })
            .focus()
            .run()
        }

        const beforeText = $from.parent.textContent.slice(0, $from.parentOffset)
        const afterText = $from.parent.textContent.slice($from.parentOffset)

        // Get marks at the cursor position to preserve formatting
        const marks = $from.marks().map((mark) => mark.toJSON())

        const attrs = $from.parent.attrs

        return (
          editor
            .chain()
            .deleteNode(this.name)
            .insertContent([
              {
                type: this.name,
                attrs,
                content: [{ type: 'text', text: beforeText, marks }],
              },
              {
                type: this.name,
                attrs,
                content: [{ type: 'text', text: afterText, marks }],
              },
            ])

            // .setTextSelection($from.pos + beforeText.length + 4)
            .run()
        )
      },
      Backspace: ({ editor }) => {
        const { empty, $anchor } = editor.state.selection
        const isAtStart = $anchor.parentOffset === 0

        if (!empty || $anchor.parent.type !== this.type) {
          return false
        }

        // Handle backspace at the start of button
        if (isAtStart) {
          const pos = $anchor.pos
          const nodeBefore = editor.state.doc.resolve(pos - 2).before(1)
          const previousNode = editor.state.doc.nodeAt(nodeBefore)

          // Case 1: Previous node is empty
          if (previousNode?.content.size === 0) {
            return editor
              .chain()
              .command(({ tr }) => {
                tr.delete(nodeBefore, nodeBefore + 2)
                return true
              })
              .setTextSelection($anchor.pos - 2)
              .run()
          }

          // Case 2: Previous node is a button
          if (previousNode?.type.name === this.name) {
            const currentButtonText = $anchor.parent.textContent
            const previousButtonText = previousNode.textContent

            const node = editor.schema.nodes[this.name].create(
              previousNode.attrs,
              editor.schema.text(previousButtonText + currentButtonText),
            )

            return editor
              .chain()
              .command(({ tr }) => {
                // Delete current button
                tr.delete($anchor.before(), $anchor.after())
                // Replace previous button's content
                tr.replaceWith(
                  nodeBefore,
                  nodeBefore + previousNode.nodeSize,
                  node as ProseMirrorNode,
                )
                return true
              })
              .setTextSelection(nodeBefore + previousButtonText.length + 1)
              .run()
          }
        }

        // Handle normal backspace within button text
        if (!$anchor.parent.textContent.length) {
          return editor.commands.clearNodes()
        }

        return false
      },
    }
  },
})
