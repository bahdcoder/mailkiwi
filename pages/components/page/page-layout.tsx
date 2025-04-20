import type React from 'react'

export interface PageLayoutProps {
  children?: React.ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <>
      <div className="h-full relative overflow-y-auto px-6">{children}</div>
    </>
  )
}
