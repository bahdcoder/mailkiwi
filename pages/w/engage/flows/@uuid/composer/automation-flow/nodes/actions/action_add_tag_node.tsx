import type { NodeElement } from '#root/pages/w/engage/flows/@uuid/composer/automation-flow/types/elements.js'
import classNames from 'classnames'
import { Handle, Position } from 'react-flow-renderer'
import { SkeletonNode } from '../skeleton_node.jsx'
import { Text } from '@kibamail/owly/text'
import { Badge } from '@kibamail/owly/badge'

export interface ActionAddTagNodeProps {
  data: NodeElement['data']
}

export function ActionAddTagNode({ data }: ActionAddTagNodeProps) {
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
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="neutral" size="sm" className="lowercase">
              2024-subscribers
            </Badge>
          </div>
        </SkeletonNode>
        <Handle type="source" position={Position.Bottom} />
        <Handle type="target" position={Position.Top} />
      </div>
    </button>
  )
}
