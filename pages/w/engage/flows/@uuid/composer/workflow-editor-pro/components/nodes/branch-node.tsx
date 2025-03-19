import nodesConfig, { type WorkflowNodeProps } from './index.jsx';
import WorkflowNode from './workflow-node/index.jsx';
import { AppHandle } from './workflow-node/app-handle.jsx';

export function BranchNode({ id, data }: WorkflowNodeProps) {
  return (
    <WorkflowNode id={id} data={data}>
      {nodesConfig['branch-node'].handles.map((handle) => (
        <AppHandle
          key={`${handle.type}-${handle.id}`}
          id={handle.id}
          type={handle.type}
          position={handle.position}
          x={handle.x}
          y={handle.y}
        />
      ))}
      {/* Implement custom node specific functionality here */}
    </WorkflowNode>
  );
}
