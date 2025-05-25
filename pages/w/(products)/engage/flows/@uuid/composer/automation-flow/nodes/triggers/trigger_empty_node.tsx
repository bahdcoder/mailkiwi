import type { NodeElement } from '#root/pages/w/(products)/engage/flows/@uuid/composer/automation-flow/types/elements'
import classNames from 'classnames'
import { Handle, Position } from 'react-flow-renderer'

export interface TriggerEmptyNodeProps {
  data: NodeElement['data']
}

export function TriggerEmptyNode({ data }: TriggerEmptyNodeProps) {
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
        </div>
      </div>
    </button>
  )
}
