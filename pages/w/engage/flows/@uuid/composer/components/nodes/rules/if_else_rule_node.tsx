import { Handle, Position } from '@xyflow/react'

export function IfElseRuleNode() {
  return (
    <div className="relative">
      <div className="w-[300px] box-border p-4 bg-gray-500 text-white">
        If else rule node
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
