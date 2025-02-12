import { Toaster } from "sonner"

export interface PageLayoutProps {}

export function PageLayout({ children }: React.PropsWithChildren<PageLayoutProps>) {
  return (
    <>
      <Toaster />
      <div className="h-full relative overflow-y-auto px-6">{children}</div>
    </>
  )
}
