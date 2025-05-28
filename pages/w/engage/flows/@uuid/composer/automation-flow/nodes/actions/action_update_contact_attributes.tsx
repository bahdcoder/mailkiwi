import type { NodeElement } from '#root/pages/w/engage/flows/@uuid/composer/automation-flow/types/elements.js'
import { Text } from '@kibamail/owly/text'
import classNames from 'classnames'
import { Handle, Position } from 'react-flow-renderer'

export interface ActionUpdateContactAttributesNodeProps {
  data: NodeElement['data']
}

export function ActionUpdateContactAttributesNode({
  data,
}: ActionUpdateContactAttributesNodeProps) {
  return (
    <button
      type="button"
      className="w-node-wrapper"
      onClick={() => data.onNodeClickCallback(data.step.id)}
    >
      <div
        className={classNames('w-node-wrapper-inner', {
          'w-node-selected': data.selected,
        })}
      >
        <Text>Update attributes</Text>
        <Handle type="source" position={Position.Bottom} />
        <Handle type="target" position={Position.Top} />
      </div>
    </button>
  )
}
