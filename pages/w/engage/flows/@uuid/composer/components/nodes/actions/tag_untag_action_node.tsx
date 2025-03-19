import { Handle, Position } from '@xyflow/react'

export function TagUntagActionNode() {
  return (
    <>
      <div className="w-[300px] box-border p-4 bg-lime-800 text-white">
        Tag untag action node
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </>
  )
}
