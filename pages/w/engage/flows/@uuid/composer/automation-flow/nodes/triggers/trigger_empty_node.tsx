import { NodeElement } from '@/pages/w/engage/flows/@uuid/composer/automation-flow/types/elements.js'
import { Handle, Position } from 'react-flow-renderer'

export interface TriggerEmptyNodeProps {
  data: NodeElement['data']
}

export function TriggerEmptyNode({ data }: TriggerEmptyNodeProps) {
  return (
    <div className="w-node-wrapper-empty">
      <div className="w-node-wrapper-inner-empty w-node-selected">
        <div className="w-full h-full border kb-border-secondary rounded-lg border-dashed">
          <Handle type="source" position={Position.Bottom} />
        </div>
      </div>
    </div>
  )
}
