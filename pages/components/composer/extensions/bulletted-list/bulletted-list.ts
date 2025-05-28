import {
  getStyleAttributeDefaultCommands,
  getStyleAttributeDefinition,
} from '#root/pages/components/composer/extensions/NodeStyles/NodeStyles.js'
import { getDefaultStylesForNode } from '#root/pages/components/composer/themes/default-theme.js'
import { BulletList as BaseBulletList } from '@tiptap/extension-bullet-list'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    bullettedList: {
      setButton: (attributes: { href: string }) => ReturnType
      setBullettedListStyles: (key: string, value: string) => ReturnType
      removeBullettedListStyles: (key: string) => ReturnType
    }
  }
}

export const BullettedList = BaseBulletList.extend({
  // name: "bullettedListWithStyles",
  addAttributes() {
    return {
      styles: getStyleAttributeDefinition(
        getDefaultStylesForNode('unorderedList').styles,
      ),
    }
  },

  addCommands() {
    return {
      setBullettedListStyles: getStyleAttributeDefaultCommands().setNodeStyle,
      removeBullettedListStyles: getStyleAttributeDefaultCommands().removeNodeStyle,
    }
  },
})
