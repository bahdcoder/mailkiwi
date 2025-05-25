import { useApplicationLayoutContext } from '#root/pages/components/dashboard/layout/application-layout-context.jsx'
import cn from 'classnames'
import React from 'react'

const DRAGGABLE_SIDEBAR_MIN_WIDTH = 240
const DRAGGABLE_SIDEBAR_MAX_WIDTH = 340
const DRAGGABLE_SIDEBAR_CLASS_NAME = 'sidebar-draggable-resizer-active'

export function DraggableSidebarResizer() {
  const {
    setSidebar,
    sidebar: { width, offscreen },
  } = useApplicationLayoutContext('DraggableSidebarResizer')

  const isDragging = React.useRef(false)

  const cursorStartDragPositionRef = React.useRef(0)
  const startDragWidthRef = React.useRef(260)
  const cursorDistanceFromMinimumRef = React.useRef(0)

  const onMouseDown = React.useCallback(
    (event: React.MouseEvent) => {
      isDragging.current = true
      cursorStartDragPositionRef.current = event.clientX
      startDragWidthRef.current = width
      window.document.body.classList.add(DRAGGABLE_SIDEBAR_CLASS_NAME)
    },
    [width],
  )

  const onMouseMove = React.useCallback(
    (mouseEvent: MouseEvent) => {
      if (isDragging.current) {
        const delta = mouseEvent.clientX - cursorStartDragPositionRef.current

        const nextWidth = startDragWidthRef.current + delta

        const width = Math.max(
          Math.min(nextWidth, DRAGGABLE_SIDEBAR_MAX_WIDTH),
          DRAGGABLE_SIDEBAR_MIN_WIDTH,
        )

        if (nextWidth < DRAGGABLE_SIDEBAR_MIN_WIDTH) {
          cursorDistanceFromMinimumRef.current = DRAGGABLE_SIDEBAR_MIN_WIDTH - nextWidth
        }

        if (cursorDistanceFromMinimumRef.current > 50) {
          setSidebar((current) => ({
            ...current,
            width: DRAGGABLE_SIDEBAR_MIN_WIDTH,
            offscreen: true,
          }))
        } else {
          setSidebar((current) => ({
            ...current,
            width,
            offscreen: false,
          }))
        }
      }
    },
    [setSidebar],
  )

  const onMouseUp = React.useCallback(() => {
    isDragging.current = false
    window.document.body.classList.remove(DRAGGABLE_SIDEBAR_CLASS_NAME)
  }, [])

  React.useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [onMouseMove, onMouseUp])

  if (!isDragging.current && offscreen) {
    return null
  }

  return (
    <div
      onMouseDown={onMouseDown}
      className={cn(
        'draggable-sidebar-resizer cursor-col-resize rounded-t-xl rounded-b-xl my-auto ease-in-out transition-[background] w-1 hover:bg-(--border-focus)',
        {
          'h-[calc(100vh-2.5rem)]': !offscreen,
          'h-[calc(100vh-6.5rem)]': offscreen,
        },
      )}
    />
  )
}
