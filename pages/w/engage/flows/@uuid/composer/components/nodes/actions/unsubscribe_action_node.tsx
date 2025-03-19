import { Handle, Position } from '@xyflow/react'

export function UnsubscribeActionNode() {
  return (
    <>
      <div className="w-[300px] box-border p-4 bg-red-500 text-white">
        Unsubscribe action node
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </>
  )
}
