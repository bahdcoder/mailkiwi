import { Handle, Position } from '@xyflow/react'

export function PercentageSplitRuleNode() {
  return (
    <>
      <div className="w-[300px] box-border p-4 bg-purple-500 text-white">
        Percentage split rule node
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </>
  )
}
