import type { PageContext } from 'vike/types'

export default function bodyAttributes(_ctx: PageContext) {
  // TODO: Return the correct sidebar width based on the cached user preferences from the server.
  // Example: User's preferred width is 325px, then return { style: "--w-sidebar-width: 325px" }
  // Example: User's sidebar is collapsed, then return { style: "--w-sidebar-width: 0px" }

  return { style: '--w-sidebar-width: 260px' }
}
