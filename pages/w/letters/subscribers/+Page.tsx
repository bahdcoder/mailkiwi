import { PageLayout } from "@/pages/components/page/page-layout.jsx"
import { ProductPageHeading } from "@/pages/components/page/product-page-heading.jsx"
import * as Tabs from "@kibamail/owly/tabs"
import { usePageContext } from "vike-react/usePageContext"

import { route } from "@/shared/routes/route_aliases.js"

function SubscribersPage() {
  const ctx = usePageContext()

  return (
    <Tabs.Content value="subscribers">
      {[1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((_) => (
        <p key={_} className="my-6 kb-content-secondary">
          Subscribers here
        </p>
      ))}
    </Tabs.Content>
  )
}

export { SubscribersPage as Page }
