import { Handle, Position } from '@xyflow/react'

export function AutomationTriggerNode() {
  return (
    <div className="relative flex flex-col items-center">
      <div className="w-[300px] box-border p-4 bg-slate-900 text-white text-center">
        trigger node
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
