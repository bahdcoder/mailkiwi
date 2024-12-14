import {
  ApplicationLayoutProvider,
  SidebarState,
} from "@/pages/components/dashboard/layout/application-layout-context.jsx"
import { DraggableSidebarResizer } from "@/pages/components/dashboard/layout/sidebar/draggable-sidebar-resizer.jsx"
import { FloatingSidebar } from "@/pages/components/dashboard/layout/sidebar/floating-sidebar.jsx"
import {
  DEFAULT_SIDEBAR_WIDTH,
  LeftSidebar,
} from "@/pages/components/dashboard/layout/sidebar/left-sidebar.jsx"
import { Topbar } from "@/pages/components/dashboard/layout/sidebar/topbar.jsx"
import cn from "classnames"
import React from "react"
import { usePageContext } from "vike-react/usePageContext"

interface ApplicationLayoutProps extends React.PropsWithChildren {}

function ApplicationLayout({ children }: ApplicationLayoutProps) {
  const ctx = usePageContext()

  const [sidebarState, setSidebarState] = React.useState<SidebarState>(function () {
    return {
      width: DEFAULT_SIDEBAR_WIDTH,
      floating: false,
      offscreen: ctx.isMobile,
    }
  })

  return (
    <ApplicationLayoutProvider sidebar={sidebarState} setSidebar={setSidebarState}>
      <Topbar />
      <div
        className={cn("w-full kb-background-secondary flex", {
          "h-screen": !sidebarState.offscreen,
          "h-[calc(100vh-4.25rem)] overflow-y-hidden": sidebarState.offscreen,
        })}
      >
        <LeftSidebar />
        <div
          className={cn("w-full py-2 pr-2 flex", {
            "pl-2": sidebarState.offscreen,
          })}
        >
          <DraggableSidebarResizer />
          <div
            className={cn(
              "w-full w-layout-container rounded-lg border kb-border-tertiary overflow-y-auto",
              {
                "h-[calc(100vh-1rem)]": !sidebarState.offscreen,
              },
            )}
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
