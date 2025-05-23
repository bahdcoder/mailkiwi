import type { NodeElement } from '#root/pages/w/engage/flows/@uuid/composer/automation-flow/types/elements.js'
import classNames from 'classnames'
import { Handle, Position } from 'react-flow-renderer'

export interface ActionUnsubscribeToAudienceNodeProps {
  data: NodeElement['data']
}

export function ActionUnsubscribeToAudienceNode({
  data,
}: ActionUnsubscribeToAudienceNodeProps) {
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
        <p>Unsubscribe from audience node</p>
        <Handle type="source" position={Position.Bottom} />
        <Handle type="target" position={Position.Top} />
      </div>
    </button>
  )
}
