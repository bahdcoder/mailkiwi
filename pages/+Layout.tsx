import './styles.css'
import type React from 'react'
import { Toaster } from 'sonner'

function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <>
      <Toaster />
      <div className="w-full h-screen border-l border-r kb-border-tertiary">
        {children}
      </div>
    </>
  )
}

export { RootLayout as Layout }
