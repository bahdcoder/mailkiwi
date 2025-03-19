import { Handle, Position } from '@xyflow/react'

export function FlowEndTriggerNode() {
  return (
    <>
      <div className="w-[300px] box-border p-4 bg-slate-300 text-white">
        Flow end trigger node
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </>
  )
}
