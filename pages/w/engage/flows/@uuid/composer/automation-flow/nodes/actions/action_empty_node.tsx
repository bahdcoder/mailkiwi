import type { NodeElement } from '#root/pages/w/engage/flows/@uuid/composer/automation-flow/types/elements.js'
import classNames from 'classnames'
import { Handle, Position } from 'react-flow-renderer'

export interface ActionEmptyNodeProps {
  data: NodeElement['data']
}

export function ActionEmptyNode({ data }: ActionEmptyNodeProps) {
  return (
    <button
      type="button"
      className="w-node-wrapper-empty"
      onClick={() => data.onNodeClickCallback(data.step.id)}
    >
      <div
        className={classNames('w-node-wrapper-inner-empty', {
          'w-node-selected': data.selected,
        })}
      >
        <div className="w-full h-full border kb-border-secondary rounded-lg border-dashed">
          <Handle type="source" position={Position.Bottom} />
          <Handle type="target" position={Position.Top} />
        </div>
      </div>
    </button>
  )
}
