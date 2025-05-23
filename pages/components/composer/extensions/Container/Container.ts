import { ContainerNodeView } from '#root/pages/components/composer/extensions/Container/container-node-view.jsx'
import {
  getStyleAttributeDefaultCommands,
  getStyleAttributeDefinition,
} from '#root/pages/components/composer/extensions/NodeStyles/NodeStyles.js'
import { getDefaultStylesForNode } from '#root/pages/components/composer/themes/default-theme.js'
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    container: {
      setContainer: () => ReturnType
      setContainerStyles: (key: string, value: string) => ReturnType
      removeContainerStyles: (key: string) => ReturnType
    }
  }
}

export const Container = Node.create({
  name: 'container',

  group: 'block',

  content: 'block+', // Only allow block nodes inside

  isolating: true, // Prevents text selection from crossing container boundaries

  defining: true, // Makes it a semantic boundary for backspace/delete

  parseHTML() {
    return [
      {
        tag: 'div[data-type="container"]',
      },
    ]
  },

  addAttributes() {
    return {
      styles: getStyleAttributeDefinition(getDefaultStylesForNode('container').styles),
    }
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'container' }, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setContainer:
        () =>
        ({ chain, state }) => {
          const insertPos = state.selection.$from.pos
          const containerNode = {
            type: this.name,
            attrs: getDefaultStylesForNode('container'),
            content: [
              {
                type: 'paragraph',
                attrs: getDefaultStylesForNode('paragraph'),
              },
            ],
          }

          const paragraphNode = {
            type: 'paragraph',
            attrs: getDefaultStylesForNode('paragraph'),
          }

          return chain()
            .insertContent([containerNode, paragraphNode])
            .focus(insertPos + 2)
            .run()
        },
      setContainerStyles: getStyleAttributeDefaultCommands().setNodeStyle,
      removeContainerStyles: getStyleAttributeDefaultCommands().removeNodeStyle,
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ContainerNodeView)
  },
})
