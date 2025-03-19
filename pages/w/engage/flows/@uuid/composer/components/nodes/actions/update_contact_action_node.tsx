import { Handle, Position } from '@xyflow/react'

export function UpdateContactActionNode() {
  return (
    <>
      <div className="w-[300px] box-border p-4 bg-orange-500 text-white">
        Update contact action node
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </>
  )
}
