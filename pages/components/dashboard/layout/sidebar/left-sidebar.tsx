import { useApplicationLayoutContext } from '#root/pages/components/dashboard/layout/application-layout-context.jsx'
import { SidebarContent } from '#root/pages/components/dashboard/layout/sidebar/sidebar-content.jsx'
import cn from 'classnames'
import { useEffect } from 'react'
import { SidebarSettingsContent } from './sidebar-settings-content.jsx'

export const DEFAULT_SIDEBAR_WIDTH = 260

interface SidebarVariant {
  variant?: 'dashboard' | 'settings'
}

export function LeftSidebar({ variant = 'dashboard' }: SidebarVariant) {
  const { sidebar } = useApplicationLayoutContext('Sidebar')

  useEffect(() => {
    document.body.style.setProperty(
      '--w-sidebar-width',
      sidebar.offscreen ? '0px' : `${sidebar.width}px`,
    )
  }, [sidebar.width, sidebar.offscreen])

  return (
    <nav
      className={cn('flex flex-col box-border shrink-0 px-2 duration-200')}
      style={{
        width: `${sidebar.width}px`,
        transition: 'margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        marginLeft: sidebar.offscreen ? `${-sidebar.width}px` : undefined,
      }}
    >
      {variant === 'dashboard' && <SidebarContent rootId="offscreen-sidebar" />}
      {variant === 'settings' && <SidebarSettingsContent rootId="offscreen-sidebar" />}
    </nav>
  )
}
