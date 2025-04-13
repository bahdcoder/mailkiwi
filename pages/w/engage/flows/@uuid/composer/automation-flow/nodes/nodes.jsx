import { BaseNode, EmptyBaseNode } from './baseNode.jsx'
import { Handle, Position } from 'react-flow-renderer'
import './styles.css'

const handleNodeClick = (props) => {
  const { data, id } = props
  data.onNodeClickCallback(id)
}

const onCloseIconClick = (event, props) => {
  event.stopPropagation()
  const { data, id } = props
  data.onDeleteNodeCallback(id)
}

export const Source = (props) => (
  <>
    <div className="w-node-wrapper">
      {/* <BaseNode
      {...props}
      onNodeClick={() => handleNodeClick(props)}
      onCloseIconClick={(event) => onCloseIconClick(event, props)}
    /> */}
    </div>
    <Handle type="source" position={Position.Bottom} />
  </>
)

export const Transparent = (props) => (
  <div className="w-full bg-red-500">
    this is a transparent empty node
    <Handle type="target" position={Position.Top} />
  </div>
)

export const Action = (props) => (
  <div className="w-node-wrapper">
    <Handle type="target" position={Position.Top} />
    <BaseNode
      {...props}
      onNodeClick={() => handleNodeClick(props)}
      onCloseIconClick={(event) => onCloseIconClick(event, props)}
    />
    <Handle type="source" position={Position.Bottom} />
  </div>
)

export const Condition = (props) => (
  <div className="w-node-wrapper">
    <Handle type="target" position={Position.Top} />
    <BaseNode
      {...props}
      additionalClassName="ConditionNode"
      onNodeClick={() => handleNodeClick(props)}
      onCloseIconClick={(event) => onCloseIconClick(event, props)}
    />
    <Handle
      id="condition_0"
      type="source"
      position={Position.Bottom}
      className="NodePort"
    />
    <Handle id="condition_1" type="source" position={Position.Bottom} />
  </div>
)

export function End() {
  return (
    <div className="w-[300px] h-[92px] flex items-start justify-center border border-transparent box-border bg-transparent">
      <div className="w-[220px] h-12 rounded-lg bg-white border kb-border-tertiary">
        <Handle type="target" position={Position.Top} />
      </div>
    </div>
  )
}

export const Empty = (props) => (
  <div className="w-node-wrapper">
    <Handle
      type="target"
      position={Position.Top}
      // style={{ opacity: 0 }}
    />
    <EmptyBaseNode {...props} disabled={true} />
    <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
  </div>
)
