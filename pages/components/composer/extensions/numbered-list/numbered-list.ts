import {
  getStyleAttributeDefaultCommands,
  getStyleAttributeDefinition,
} from '#root/pages/components/composer/extensions/NodeStyles/NodeStyles.js'
import { getDefaultStylesForNode } from '#root/pages/components/composer/themes/default-theme.js'
import { OrderedList as BaseNumberedList } from '@tiptap/extension-ordered-list'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    numberedList: {
      setButton: (attributes: { href: string }) => ReturnType
      setNumberedListStyles: (key: string, value: string) => ReturnType
      removeNumberedListStyles: (key: string) => ReturnType
    }
  }
}

export const NumberedList = BaseNumberedList.extend({
  // name: "numberedListWithStyles",
  addAttributes() {
    return {
      styles: getStyleAttributeDefinition(getDefaultStylesForNode('orderedList').styles),
    }
  },

  addCommands() {
    return {
      setNumberedListStyles: getStyleAttributeDefaultCommands().setNodeStyle,
      removeNumberedListStyles: getStyleAttributeDefaultCommands().removeNodeStyle,
    }
  },
})
