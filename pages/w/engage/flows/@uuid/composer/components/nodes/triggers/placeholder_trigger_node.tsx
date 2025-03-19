import { Handle, Position } from '@xyflow/react'

export function PlaceholderTriggerNode() {
  return (
    <div className="relative flex flex-col items-center">
      <div className="w-[300px] box-border p-4 bg-slate-900 text-white opacity-30 text-center">
        Placeholder trigger node
      </div>

      <Handle
        type="target"
        position={Position.Top}
        style={{ left: '50%', transform: 'translateX(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ left: '50%', transform: 'translateX(-50%)' }}
      />
    </div>
  )
}
