import { ProhibitionIcon } from '#root/pages/components/icons/prohibition.svg.jsx'
import { Badge } from '@kibamail/owly/badge'
import { Text } from '@kibamail/owly/text'
import { Handle, Position } from 'react-flow-renderer'

export type EndNodeProps = Record<string, never>

export function EndNode(props: EndNodeProps) {
  return (
    <>
      <div className="w-[300px] cursor-not-allowed h-[104px] flex items-start justify-center border border-transparent box-border bg-transparent">
        <div className="w-[220px] h-12 p-3 flex items-center justify-between rounded-lg bg-white border kb-border-tertiary">
          <div className="flex items-center gap-1">
            <ProhibitionIcon className="w-5 h-5 kb-content-disabled" />

            <Text className="kb-content-secondary">Flow completed</Text>
          </div>

          <Badge size="sm" variant="neutral">
            End
          </Badge>
        </div>
      </div>
      <Handle type="target" position={Position.Top} />
    </>
  )
}
