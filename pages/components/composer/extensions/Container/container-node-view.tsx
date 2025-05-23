import { convertToReactStyles } from '#root/pages/components/composer/utils/convert-styles-to-react-styles.js'
import { NodeViewContent, type NodeViewProps, NodeViewWrapper } from '@tiptap/react'
import cn from 'classnames'

export type ContainerNodeViewProps = NodeViewProps

export function ContainerNodeView(props: ContainerNodeViewProps) {
  const { background, ...styles } = convertToReactStyles(props.node.attrs.styles)

  const isSelected = props.editor.isActive('container')

  return (
    <NodeViewWrapper
      className={cn('w-full flex flex-col w-composer-node-container', {
        'w-composer-node-container-active': isSelected,
        'w-composer-node-container-inactive': !isSelected,
      })}
    >
      <NodeViewContent style={styles} />
    </NodeViewWrapper>
  )
}
