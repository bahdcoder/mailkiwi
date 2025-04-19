import type { NodeElement } from '@/pages/w/engage/flows/@uuid/composer/automation-flow/types/elements.js'
import classNames from 'classnames'
import { Handle, Position } from 'react-flow-renderer'

export interface ActionSendEmailNodeProps {
  data: NodeElement['data']
}

export function ActionSendEmailNode({ data }: ActionSendEmailNodeProps) {
  return (
    <div
      className="w-node-wrapper"
      role="button"
      onClick={() => data.onNodeClickCallback(data.step.id)}
    >
      <div
        className={classNames('w-node-wrapper-inner', {
          'w-node-selected': data.selected,
        })}
      >
        <p>send email</p>
        <Handle type="source" position={Position.Bottom} />
        <Handle type="target" position={Position.Top} />
      </div>
    </div>
  )
}
