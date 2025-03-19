import { Handle, Position } from '@xyflow/react'

export function SendWebhookActionNode() {
  return (
    <>
      <div className="w-[300px] box-border p-4 bg-green-500 text-white">
        Send webhook action node
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </>
  )
}
