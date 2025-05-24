import { useApplicationLayoutContext } from '#root/pages/components/dashboard/layout/application-layout-context.jsx'
import { FooterMenuItems } from '#root/pages/components/dashboard/layout/footer-menu-items.jsx'
import { SearchBoxTrigger } from '#root/pages/components/dashboard/layout/sidebar/search-box-trigger.jsx'
import { WorkspacesDropdownMenu } from '#root/pages/components/dashboard/layout/workspace-dropdown-menu.jsx'
import { SidebarExpandIcon } from '#root/pages/components/icons/sidebar-expand.svg.jsx'
import React from 'react'
import { usePageContext } from 'vike-react/usePageContext'

export function Topbar() {
  const { isMobile } = usePageContext()

  const [topbarVisible, setTopbarVisible] = React.useState(() => isMobile)
  const { sidebar, setSidebar } = useApplicationLayoutContext('Topbar')

  function setSidebarOnScreen() {
    if (isMobile) {
      setSidebar((current) => ({ ...current, floating: true }))

      return
    }

    setSidebar((current) => ({ ...current, offscreen: false }))
  }

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTopbarVisible(sidebar.offscreen)
    }, 200)

    return () => clearTimeout(timer)
  }, [sidebar.offscreen])

  return (
    <nav
      className="w-full lg:h-16 box-border px-2 py-4 flex items-center relative"
      style={{
        transition: 'margin-top 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        marginTop: topbarVisible ? '0px' : '-64px',
      }}
    >
      <button
        type="button"
        aria-label="Expand sidebar"
        className="kb-reset"
        onClick={setSidebarOnScreen}
      >
        <SidebarExpandIcon className="kb-content-tertiary-inverse" />
      </button>

      <div className="ml-2 max-w-33">
        <WorkspacesDropdownMenu rootId="topbar-workspaces" />
      </div>

      <div className="max-w-md hidden lg:flex w-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 justify-center items-center">
        <SearchBoxTrigger />
      </div>

      <div className="ml-auto hidden lg:flex items-center gap-x-4">
        <FooterMenuItems />
      </div>
    </nav>
  )
}
