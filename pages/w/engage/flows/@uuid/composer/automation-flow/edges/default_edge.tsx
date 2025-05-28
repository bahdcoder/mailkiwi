import {
  type EdgeProps,
  getBezierPath,
  getEdgeCenter,
  getMarkerEnd,
} from 'react-flow-renderer'

import { PlusIcon } from '#root/pages/components/icons/plus.svg.jsx'
import type { EdgeElement } from '#root/pages/w/engage/flows/@uuid/composer/automation-flow/types/elements.js'
import { Button } from '@kibamail/owly/button'

const [buttonWidth, buttonHeight] = [100, 40]

export function DefaultEdge(props: EdgeProps<EdgeElement['data']>) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } =
    props
  const edgePath = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })
  const markerEnd = getMarkerEnd()

  const [edgeCenterX, edgeCenterY] = getEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

  return (
    <>
      <path
        id={id}
        d={edgePath}
        markerEnd={markerEnd}
        className="react-flow__edge-path"
      />
      <foreignObject
        width={buttonWidth}
        height={buttonHeight}
        x={edgeCenterX - buttonWidth / 2}
        y={edgeCenterY - buttonHeight / 2}
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div className="flex items-center justify-center">
          <Button
            variant="primary"
            onClick={() => data?.onAddNodeCallback(id)}
            className="kb-background-info border-(--black-5) rounded-lg w-7 h-7 p-0 flex items-center justify-center"
            style={{ pointerEvents: 'all' }}
          >
            <PlusIcon />
          </Button>
        </div>
      </foreignObject>
    </>
  )
}
