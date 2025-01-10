import { PageLayout } from "@/pages/components/page/page-layout.jsx"
import { ProductPageHeading } from "@/pages/components/page/product-page-heading.jsx"
import * as Tabs from "@kibamail/owly/tabs"
import { usePageContext } from "vike-react/usePageContext"

import { route } from "@/shared/routes/route_aliases.js"

function EngageLayout({ children }: React.PropsWithChildren) {
  const ctx = usePageContext()

  function getDefaultTabValue() {
    const pathname = ctx.urlPathname

    if (pathname.includes("contacts")) return "contacts"

    if (pathname.includes("automations")) return "automations"

    return "broadcasts"
  }

  if (ctx.routeParams.uuid) {
    return <>{children}</>
  }

  return (
    <PageLayout>
      <Tabs.Root
        variant="secondary"
        defaultValue={getDefaultTabValue()}
        width={"full"}
        className="relative"
      >
        <ProductPageHeading>
          <div className="w-full flex">
            <div className="w-full lg:w-auto">
              <Tabs.List className="lg:w-[fit-content] gap-x-4">
                <Tabs.Trigger asChild value="broadcasts" className="px-0">
                  <a href={route("engage")}>Broadcasts</a>
                </Tabs.Trigger>
                <Tabs.Trigger asChild value="contacts" className="px-0">
                  <a href={route("engage_contacts")}>Contacts</a>
                </Tabs.Trigger>
                <Tabs.Trigger asChild value="automations" className="px-0">
                  <a href={route("engage_automations")}>Automations</a>
                </Tabs.Trigger>
                <Tabs.Indicator />
              </Tabs.List>
            </div>
            <div className="flex-grow hidden lg:block h-px bg-[var(--black-5)] w-full self-end"></div>
          </div>
        </ProductPageHeading>
        <div className="w-layout-container">{children}</div>
      </Tabs.Root>
    </PageLayout>
  )
}

export { EngageLayout as Layout }
