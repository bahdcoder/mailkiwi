import { TableOfContentsNode } from '#root/pages/components/composer/extensions/TableOfContentsNode/TableOfContentsNode.jsx'
import {
  CodeBlock,
  Figcaption,
  HorizontalRule,
  ImageBlock,
  ImageUpload,
  Link,
} from '#root/pages/components/composer/extensions/index.js'
import type { Editor } from '@tiptap/react'

export const isTableGripSelected = (node: HTMLElement) => {
  let container = node

  while (container && !['TD', 'TH'].includes(container.tagName)) {
    const parentElement = container.parentElement
    if (!parentElement) break
    container = parentElement
  }

  const gripColumn = container?.querySelector?.('a.grip-column.selected')
  const gripRow = container?.querySelector?.('a.grip-row.selected')

  if (gripColumn || gripRow) {
    return true
  }

  return false
}

export const isCustomNodeSelected = (editor: Editor, node: HTMLElement) => {
  const customNodes = [
    HorizontalRule.name,
    ImageBlock.name,
    ImageUpload.name,
    CodeBlock.name,
    ImageBlock.name,
    Link.name,
    Figcaption.name,
    TableOfContentsNode.name,
  ]

  return customNodes.some((type) => editor.isActive(type)) || isTableGripSelected(node)
}

export default isCustomNodeSelected
