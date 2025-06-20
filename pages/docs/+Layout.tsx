import { DocsHeader } from './components/DocsHeader.js'
import { DocsSidebar } from './components/DocsSidebar.js'
import { DocsContentArea } from './components/DocsContentArea.js'
import { DocsTableOfContents } from './components/DocsTableOfContents.js'
import { DocsFooter } from './components/DocsFooter.js'
import { DocsThemeSelector } from './components/DocsThemeSelector.js'

function DocsLayout({ children }: React.PropsWithChildren) {
  return (
    <div>
      <DocsHeader />

      <div className="grid min-h-dvh grid-cols-1 grid-rows-[1fr_1px_auto_1px_auto] pt-26.25 lg:grid-cols-[var(--container-2xs)_2.5rem_minmax(0,1fr)_2.5rem] lg:pt-14.25 xl:grid-cols-[var(--container-2xs)_2.5rem_minmax(0,1fr)_2.5rem]">
        <DocsSidebar />

        <div className="col-start-2 row-span-5 row-start-1 border-x border-x-(--pattern-fg) bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed [--pattern-fg:var(--color-gray-950)]/5 max-lg:hidden dark:[--pattern-fg:var(--color-white)]/10" />

        <div className="relative row-start-1 grid grid-cols-subgrid lg:col-start-3">
          <div hidden />

          <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-10 xl:max-w-5xl xl:grid-cols-[minmax(0,1fr)_var(--container-2xs)]">
            <DocsContentArea>{children}</DocsContentArea>

            <DocsTableOfContents />
          </div>
        </div>

        <div className="col-start-4 row-span-5 row-start-1 border-x border-x-(--pattern-fg) bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-fixed [--pattern-fg:var(--color-gray-950)]/5 max-lg:hidden dark:[--pattern-fg:var(--color-white)]/10" />

        <div className="col-span-full col-start-2 row-start-2 h-px bg-gray-950/5 dark:bg-white/10" />
        <div className="row-start-3 lg:col-start-3">
          <DocsFooter />
        </div>

        <div className="col-span-full col-start-2 row-start-4 h-px bg-gray-950/5 dark:bg-white/10" />

        <div className="row-start-5 grid lg:col-start-3">
          <DocsThemeSelector />
        </div>
      </div>
    </div>
  )
}

export { DocsLayout as Layout }
