import { useApplicationLayoutContext } from '#root/pages/components/dashboard/layout/application-layout-context.jsx'
import { SidebarContent } from '#root/pages/components/dashboard/layout/sidebar/sidebar-content.jsx'
import cn from 'classnames'
import React from 'react'
import { usePageContext } from 'vike-react/usePageContext'

export function FloatingSidebar() {
  const ctx = usePageContext()

  const menuRef = React.useRef<HTMLDivElement | null>(null)
  const slideInSidebarTriggerRef = React.useRef<HTMLDivElement | null>(null)

  const { sidebar, setSidebar } = useApplicationLayoutContext('FloatingSidebar')

  function onMouseEnter() {
    setVisible(true)
  }

  function setVisible(visible: boolean) {
    setSidebar((current) => ({ ...current, floating: visible }))
  }

  function onMouseLeave(event: React.MouseEvent<HTMLDivElement>) {
    const workspacesDropdownMenuTrigger = document.querySelector(
      '#floating-sidebar-dropdown-menu-trigger',
    )

    const workspacesDropdownMenuContent = document.querySelector(
      '#floating-sidebar-dropdown-menu-content',
    )

    if (
      workspacesDropdownMenuTrigger?.contains(event.target as Node) ||
      workspacesDropdownMenuTrigger === event.target
    ) {
      return
    }

    if (
      workspacesDropdownMenuContent?.contains(event.target as Node) ||
      workspacesDropdownMenuContent === event.target
    ) {
      return
    }

    setVisible(false)

    return
  }

  function hideFloatingSidebar(event: React.MouseEvent) {
    setVisible(false)
  }

  return (
    <>
      {sidebar.offscreen ? (
        <div
          onMouseMove={onMouseEnter}
          ref={slideInSidebarTriggerRef}
          className="absolute hidden lg:block h-[calc(100vh-6rem)] top-16 bg-transparent z-50 -left-2 w-6"
        />
      ) : null}
      {ctx.isMobile ? (
        <div
          className={cn(
            'w-full h-screen bg-[rgba(17,17,17,0.10)] transition-opacity ease-in-out duration-200 absolute top-0 pl-2 left-0 z-5 py-6 flex items-center',
            {
              'pointer-events-none opacity-0': !sidebar.floating,
              'pointer-events-auto opacity-100': sidebar.floating,
            },
          )}
        >
          <button
            type="button"
            onClick={hideFloatingSidebar}
            onKeyDown={(e) =>
              e.key === 'Escape' && hideFloatingSidebar(e as unknown as React.MouseEvent)
            }
            tabIndex={0}
            className="absolute w-[calc(100vw-256px)] right-0 h-screen bg-transparent border-0"
          />
        </div>
      ) : (
        <button
          type="button"
          tabIndex={0}
          onClick={hideFloatingSidebar}
          onKeyDown={(e) =>
            e.key === 'Escape' && hideFloatingSidebar(e as unknown as React.MouseEvent)
          }
          className={cn(
            'w-full h-screen bg-[rgba(17,17,17,0.10)] transition-opacity ease-in-out duration-200 absolute top-0 pl-2 left-0 z-5 py-6 flex items-center border-0',
            {
              'pointer-events-none opacity-0': !sidebar.floating,
              'pointer-events-auto opacity-100': sidebar.floating,
            },
          )}
        />
      )}
      <div
        ref={menuRef}
        onMouseLeave={ctx.isMobile ? undefined : onMouseLeave}
        style={{
          transform: `translateX(${sidebar.floating ? '0px' : '-284px'})`,
        }}
        className="h-[calc(100vh-2rem)] mt-4 absolute left-4 top-0 z-20 transition-transform duration-300 kb-background-secondary w-64 p-2 flex flex-col rounded-2xl shadow-[0px_16px_24px_-8px_var(--black-10)]"
      >
        <SidebarContent rootId="floating-sidebar" />
      </div>
    </>
  )
}
