import { HorizontalRuleNodeView } from '#root/pages/components/composer/extensions/HorizontalRule/horizontal-rule-node-view.jsx'
import {
  getStyleAttributeDefaultCommands,
  getStyleAttributeDefinition,
} from '#root/pages/components/composer/extensions/NodeStyles/NodeStyles.js'
import { getDefaultStylesForNode } from '#root/pages/components/composer/themes/default-theme.js'
import { mergeAttributes } from '@tiptap/core'
import TiptapHorizontalRule from '@tiptap/extension-horizontal-rule'
import { ReactNodeViewRenderer } from '@tiptap/react'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    styledHorizontalRule: {
      setHorizontalRuleStyles: (key: string, value: string) => ReturnType
      removeHorizontalRuleStyles: (key: string) => ReturnType
    }
  }
}

export const HorizontalRule = TiptapHorizontalRule.extend({
  renderHTML() {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, { 'data-type': this.name }),
      ['hr'],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(HorizontalRuleNodeView)
  },

  addAttributes() {
    return {
      styles: getStyleAttributeDefinition(
        getDefaultStylesForNode('horizontalRule').styles,
      ),
    }
  },

  // addCommands() {
  //   const parentCommands = this.parent?.() || {}
  //   return {
  //     ...parentCommands,
  //     setHorizontalRuleStyles: getStyleAttributeDefaultCommands().setNodeStyle,
  //     removeHorizontalRuleStyles: getStyleAttributeDefaultCommands().removeNodeStyle,
  //   }
  // },
})

export default HorizontalRule
