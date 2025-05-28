import './styles.css'
import {
  ApplicationLayoutProvider,
  type SidebarState,
} from '#root/pages/components/dashboard/layout/application-layout-context.jsx'
import { DraggableSidebarResizer } from '#root/pages/components/dashboard/layout/sidebar/draggable-sidebar-resizer.jsx'
import { FloatingSidebar } from '#root/pages/components/dashboard/layout/sidebar/floating-sidebar.jsx'
import {
  DEFAULT_SIDEBAR_WIDTH,
  LeftSidebar,
} from '#root/pages/components/dashboard/layout/sidebar/left-sidebar.jsx'
import { Topbar } from '#root/pages/components/dashboard/layout/sidebar/topbar.jsx'
import cn from 'classnames'
import React from 'react'
import { usePageContext } from 'vike-react/usePageContext'

interface ApplicationLayoutProps extends React.PropsWithChildren {}

function ApplicationLayout({ children }: ApplicationLayoutProps) {
  const { urlPathname, isMobile } = usePageContext()

  const [sidebarState, setSidebarState] = React.useState<SidebarState>(() => ({
    width: DEFAULT_SIDEBAR_WIDTH,
    floating: false,
    offscreen: isMobile,
  }))

  if (urlPathname.includes('composer')) {
    return <>{children}</>
  }

  return (
    <ApplicationLayoutProvider sidebar={sidebarState} setSidebar={setSidebarState}>
      <Topbar />
      <div
        className={cn('w-full kb-background-secondary flex', {
          'h-screen': !sidebarState.offscreen,
          'h-[calc(100vh-4.25rem)] overflow-y-hidden': sidebarState.offscreen,
        })}
      >
        <LeftSidebar />
        <div
          className={cn('w-full py-2 pr-2 flex', {
            'pl-2': sidebarState.offscreen,
          })}
        >
          <DraggableSidebarResizer />
          <div
            className={cn('w-full rounded-lg border kb-border-tertiary overflow-y-auto', {
              'h-[calc(100vh-1rem)]': !sidebarState.offscreen,
            })}
          >
            {children}
          </div>
        </div>
      </div>
      <FloatingSidebar />
    </ApplicationLayoutProvider>
  )
}

export { ApplicationLayout as Layout }
