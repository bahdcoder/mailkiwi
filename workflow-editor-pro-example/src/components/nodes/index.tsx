import { Node, NodeProps, Position, XYPosition } from '@xyflow/react';
import { nanoid } from 'nanoid';

import { iconMapping } from '@/data/icon-mapping';

import { OutputNode } from './output-node';
import { InitialNode } from './initial-node';
import { TransformNode } from './transform-node';
import { BranchNode } from './branch-node';
import { JoinNode } from './join-node';

/* WORKFLOW NODE DATA PROPS ------------------------------------------------------ */

export type WorkflowNodeData = {
  title?: string;
  label?: string;
  icon?: keyof typeof iconMapping;
  status?: 'loading' | 'success' | 'error' | 'initial';
};

export type WorkflowNodeProps = NodeProps<Node<WorkflowNodeData>> & {
  type: AppNodeType;
  children?: React.ReactNode;
};

export type NodeConfig = {
  id: AppNodeType;
  title: string;
  status?: 'loading' | 'success' | 'error' | 'initial';
  handles: NonNullable<Node['handles']>;
  icon: keyof typeof iconMapping;
};

export const NODE_SIZE = { width: 260, height: 50 };

const nodesConfig: Record<AppNodeType, NodeConfig> = {
  'initial-node': {
    id: 'initial-node',
    title: 'Initial Node',
    status: 'initial',
    handles: [
      {
        type: 'source',
        position: Position.Bottom,
        x: NODE_SIZE.width * 0.5,
        y: NODE_SIZE.height,
      },
    ],
    icon: 'Rocket',
  },
  'transform-node': {
    id: 'transform-node',
    title: 'Transform Node',
    handles: [
      {
        type: 'source',
        position: Position.Bottom,
        x: NODE_SIZE.width * 0.5,
        y: NODE_SIZE.height,
      },
      {
        type: 'target',
        position: Position.Top,
        x: NODE_SIZE.width * 0.5,
        y: 0,
      },
    ],
    icon: 'Spline',
  },
  'join-node': {
    id: 'join-node',
    title: 'Join Node',
    status: 'initial',
    handles: [
      {
        id: 'true',
        type: 'target',
        position: Position.Top,
        x: NODE_SIZE.width - 25,
        y: 0,
      },
      {
        id: 'false',
        type: 'target',
        position: Position.Top,
        x: 25,
        y: 0,
      },
      {
        type: 'source',
        position: Position.Bottom,
        x: NODE_SIZE.width * 0.5,
        y: NODE_SIZE.height,
      },
    ],
    icon: 'Split',
  },
  'branch-node': {
    id: 'branch-node',
    title: 'Branch Node',
    status: 'initial',
    handles: [
      {
        type: 'target',
        position: Position.Top,
        x: NODE_SIZE.width * 0.5,
        y: 0,
      },
      {
        id: 'true',
        type: 'source',
        position: Position.Bottom,
        x: 25,
        y: NODE_SIZE.height,
      },
      {
        id: 'false',
        type: 'source',
        position: Position.Bottom,
        x: NODE_SIZE.width - 25,
        y: NODE_SIZE.height,
      },
    ],
    icon: 'Merge',
  },
  'output-node': {
    id: 'output-node',
    title: 'Output Node',
    handles: [
      {
        type: 'target',
        position: Position.Top,
        x: NODE_SIZE.width * 0.5,
        y: 0,
      },
    ],
    icon: 'CheckCheck',
  },
};

export const nodeTypes = {
  'initial-node': InitialNode,
  'output-node': OutputNode,
  'transform-node': TransformNode,
  'branch-node': BranchNode,
  'join-node': JoinNode,
};

export function createNodeByType({
  type,
  id,
  position = { x: 0, y: 0 },
  data,
}: {
  type: AppNodeType;
  id?: string;
  position?: XYPosition;
  data?: WorkflowNodeData;
}): AppNode {
  const node = nodesConfig[type];

  const newNode: AppNode = {
    id: id ?? nanoid(),
    data: data ?? {
      title: node.title,
      status: node.status,
      icon: node.icon,
    },
    position: {
      x: position.x - NODE_SIZE.width * 0.5,
      y: position.y - NODE_SIZE.height * 0.5,
    },
    type,
  };

  return newNode;
}

export type AppNode =
  | Node<WorkflowNodeData, 'initial-node'>
  | Node<WorkflowNodeData, 'transform-node'>
  | Node<WorkflowNodeData, 'join-node'>
  | Node<WorkflowNodeData, 'branch-node'>
  | Node<WorkflowNodeData, 'output-node'>;

export type AppNodeType = NonNullable<AppNode['type']>;

export default nodesConfig;
