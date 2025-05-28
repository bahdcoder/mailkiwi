import { convertToReactStyles } from '#root/pages/components/composer/utils/convert-styles-to-react-styles.js'
import { type NodeViewProps, NodeViewWrapper } from '@tiptap/react'

export type HorizontalRuleNodeViewProps = NodeViewProps

export function HorizontalRuleNodeView(props: HorizontalRuleNodeViewProps) {
  const { ...styles } = convertToReactStyles(props.node.attrs.styles)

  return (
    <NodeViewWrapper>
      <hr style={styles} />
    </NodeViewWrapper>
  )
}
