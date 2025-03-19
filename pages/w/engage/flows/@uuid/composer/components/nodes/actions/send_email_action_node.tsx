import { Handle, Position } from '@xyflow/react'

export function SendEmailActionNode() {
  return (
    <>
      <div className="w-[300px] box-border bg-blue-500 text-white">
        Send email action node
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </>
  )
}
