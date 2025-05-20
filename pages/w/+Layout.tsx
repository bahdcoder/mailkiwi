import './styles.css'
import {
  ApplicationLayoutProvider,
  type SidebarState,
} from '@/pages/components/dashboard/layout/application-layout-context.jsx'
import { DraggableSidebarResizer } from '@/pages/components/dashboard/layout/sidebar/draggable-sidebar-resizer.jsx'
import { FloatingSidebar } from '@/pages/components/dashboard/layout/sidebar/floating-sidebar.jsx'
import {
  DEFAULT_SIDEBAR_WIDTH,
  LeftSidebar,
} from '@/pages/components/dashboard/layout/sidebar/left-sidebar.jsx'
import { Topbar } from '@/pages/components/dashboard/layout/sidebar/topbar.jsx'
import cn from 'classnames'
import React, { useEffect } from 'react' // Import useEffect
import { usePageContext } from 'vike-react/usePageContext'
import * as Sentry from '@sentry/react' // Import Sentry

interface ApplicationLayoutProps extends React.PropsWithChildren {}

function ApplicationLayout({ children }: ApplicationLayoutProps) {
  const pageContext = usePageContext()
  const { urlPathname, isMobile } = pageContext

  // Attempt to get user and team from pageContext, trying common structures
  const user = pageContext.user || pageContext.data?.user
  const team = pageContext.team || pageContext.data?.team || pageContext.data?.currentTeam

  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username, // Assuming username might exist
        // Add any other relevant user attributes if available
      })
    }
    if (team) {
      Sentry.setTag('team_id', team.id)
      Sentry.setContext('organization', { // Consistent with server-side context name
        id: team.id,
        name: team.name,
        slug: team.slug, // Assuming slug might exist
      })
    }
  }, [user, team]) // Rerun effect if user or team data changes

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
