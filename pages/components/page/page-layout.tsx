export type PageLayoutProps = {}

export function PageLayout({ children }: React.PropsWithChildren<PageLayoutProps>) {
  return (
    <>
      <div className="h-full relative overflow-y-auto px-6">{children}</div>
    </>
  )
}
