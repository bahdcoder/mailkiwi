import { SlashIcon } from '#root/pages/components/icons/slash.svg.jsx'
import { PageLayout } from '#root/pages/components/page/page-layout.jsx'
import { ProductPageHeading } from '#root/pages/components/page/product-page-heading.jsx'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import * as Tabs from '@kibamail/owly/tabs'
import { usePageContext } from 'vike-react/usePageContext'

import { route } from '#root/core/shared/routes/route_aliases.js'
import { usePageContextWithProps } from '#root/pages/hooks/use_page_props.js'

function SingleLetterLayout({ children }: React.PropsWithChildren) {
  const { urlPathname, routeParams } = usePageContextWithProps()

  function getDefaultTabValue() {
    if (urlPathname.includes('performance')) return 'performance'

    return 'overview'
  }

  if (urlPathname.includes('composer')) {
    return <>{children}</>
  }

  return (
    <PageLayout>
      <Tabs.Root variant="secondary" defaultValue={getDefaultTabValue()} width={'full'}>
        <ProductPageHeading
          header={
            <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col">
                <div className="flex items-center text-sm mb-1">
                  <a
                    href={route('engage')}
                    className="kb-content-tertiary hover:text-(--kb-content-secondary)"
                  >
                    Broadcasts
                  </a>
                  <SlashIcon className="w-4 h-4" />
                  <span>This is the newsletter #{routeParams.uuid}</span>
                </div>
                <Heading variant="display" size="xs">
                  This is the newsletter #{routeParams.uuid}
                </Heading>
              </div>

              <div className="flex items-center">
                <Button variant="secondary">View on website</Button>
              </div>
            </div>
          }
        >
          <div className="w-full flex">
            <div className="w-full lg:w-auto">
              <Tabs.List className="lg:w-fit gap-x-4">
                <Tabs.Trigger asChild value="overview" className="px-0">
                  <a
                    href={route('engage_overview', {
                      uuid: routeParams.uuid,
                    })}
                  >
                    Overview
                  </a>
                </Tabs.Trigger>
                <Tabs.Trigger asChild value="performance" className="px-0">
                  <a
                    href={route('engage_performance', {
                      uuid: routeParams.uuid,
                    })}
                  >
                    Performance
                  </a>
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

export { SingleLetterLayout as Layout }
