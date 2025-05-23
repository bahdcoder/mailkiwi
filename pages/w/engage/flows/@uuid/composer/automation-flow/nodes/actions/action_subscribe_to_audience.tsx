import type { NodeElement } from '#root/pages/w/engage/flows/@uuid/composer/automation-flow/types/elements.js'
import classNames from 'classnames'
import { Handle, Position } from 'react-flow-renderer'
import { SkeletonNode } from '../skeleton_node.jsx'
import { Text } from '@kibamail/owly/text'

export interface ActionSubscribeToAudienceNodeProps {
  data: NodeElement['data']
}

export function ActionSubscribeToAudienceNode({
  data,
}: ActionSubscribeToAudienceNodeProps) {
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
        <SkeletonNode step={data.step}>
          <Text>
            Add contact to{' '}
            <span className="kb-content-primary font-medium px-1">watchers</span> audience
          </Text>
        </SkeletonNode>
        <Handle type="source" position={Position.Bottom} />
        <Handle type="target" position={Position.Top} />
      </div>
    </button>
  )
}
