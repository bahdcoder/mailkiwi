import { PageLayout } from '#root/pages/components/page/page-layout.jsx'
import { ProductPageHeading } from '#root/pages/components/page/product-page-heading.jsx'
import * as Tabs from '@kibamail/owly/tabs'
import { usePageContext } from 'vike-react/usePageContext'

import { route } from '#root/core/shared/routes/route_aliases.js'

function EngageLayout({ children }: React.PropsWithChildren) {
  const { urlPathname, routeParams, engage } = usePageContext()

  function getDefaultTabValue() {
    const pathname = urlPathname

    if (pathname.includes('contacts')) return 'contacts'

    if (pathname.includes('flows')) return 'flows'

    return 'broadcasts'
  }

  if (routeParams.uuid) {
    return <>{children}</>
  }

  if (!engage.onboarded) {
    return <>{children}</>
  }

  if (urlPathname.includes('composer')) {
    return <>{children}</>
  }

  return (
    <PageLayout>
      <Tabs.Root
        variant="secondary"
        defaultValue={getDefaultTabValue()}
        width={'full'}
        className="relative"
      >
        <ProductPageHeading>
          <div className="w-full flex">
            <div className="w-full lg:w-auto">
              <Tabs.List className="lg:w-fit gap-x-4">
                <Tabs.Trigger asChild value="broadcasts" className="px-0">
                  <a href={route('engage')}>Broadcasts</a>
                </Tabs.Trigger>
                <Tabs.Trigger asChild value="contacts" className="px-0">
                  <a href={route('engage_contacts')}>Contacts</a>
                </Tabs.Trigger>
                <Tabs.Trigger asChild value="flows" className="px-0">
                  <a href={route('engage_automations')}>Flows</a>
                </Tabs.Trigger>
                <Tabs.Indicator />
              </Tabs.List>
            </div>
            <div className="grow hidden lg:block h-px bg-(--black-5) w-full self-end" />
          </div>
        </ProductPageHeading>
        <div className="w-layout-container">{children}</div>
      </Tabs.Root>
    </PageLayout>
  )
}

export { EngageLayout as Layout }
