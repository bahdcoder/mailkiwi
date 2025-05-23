import type { NodeElement } from '#root/pages/w/engage/flows/@uuid/composer/automation-flow/types/elements.js'
import classNames from 'classnames'
import { Handle, Position } from 'react-flow-renderer'
import { SkeletonNode } from '../skeleton_node.jsx'
import { Text } from '@kibamail/owly/text'

export interface RuleIfElseNodeProps {
  data: NodeElement['data']
}

export function RuleIfElseNode({ data }: RuleIfElseNodeProps) {
  return (
    <button
      type="button"
      className="w-node-wrapper"
      onClick={() => data.onNodeClickCallback(data.step.id)}
    >
      <div
        className={classNames('w-node-wrapper-inner', {
          'w-node-selected': data.selected,
        })}
      >
        <SkeletonNode step={data?.step}>
          <Text className="kb-content-tertiary">
            <span className="kb-content-primary font-medium pr-1">2</span>
            filter conditions
          </Text>
        </SkeletonNode>
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
      </div>
    </button>
  )
}
