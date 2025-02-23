import * as ReactContext from '@radix-ui/react-context'

export type SidebarState = {
  width: number
  floating: boolean
  offscreen: boolean
}

export const [ApplicationLayoutProvider, useApplicationLayoutContext] =
  ReactContext.createContext<{
    sidebar: SidebarState
    setSidebar: React.Dispatch<React.SetStateAction<SidebarState>>
  }>('ApplicationLayout')
