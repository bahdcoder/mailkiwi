import { convertToReactStyles } from '#root/pages/components/composer/utils/convert-styles-to-react-styles.js'
import { NodeViewContent, type NodeViewProps, NodeViewWrapper } from '@tiptap/react'
import cn from 'classnames'

export type ButtonNodeViewProps = NodeViewProps

export function ButtonNodeView(props: ButtonNodeViewProps) {
  const { textAlign, ...styles } = convertToReactStyles(props.node.attrs.styles)

  // const isSelected = editor.isAC
  const isSelected = props.editor.isActive('button')

  return (
    <NodeViewWrapper
      className={cn('w-full flex flex-col p-2 w-composer-node-container', {
        'w-composer-node-container-active': isSelected,
        'w-composer-node-container-inactive': !isSelected,
      })}
    >
      <NodeViewContent
        style={styles}
        className={cn('text-center transition-all ease-in-out duration-200', {
          'self-start': textAlign === 'left',
          'self-center': textAlign === 'center',
          'self-end': textAlign === 'right',
        })}
      />
    </NodeViewWrapper>
  )
}
