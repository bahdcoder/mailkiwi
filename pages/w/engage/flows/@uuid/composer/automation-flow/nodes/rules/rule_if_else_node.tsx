import { NodeElement } from '@/pages/w/engage/flows/@uuid/composer/automation-flow/types/elements.js'
import { Handle, Position } from 'react-flow-renderer'

export interface RuleIfElseNodeProps {
  data: NodeElement['data']
}

export function RuleIfElseNode({ data }: RuleIfElseNodeProps) {
  return (
    <div className="w-node-wrapper">
      <div className="w-node-wrapper-inner">
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
      </div>
    </div>
  )
}
