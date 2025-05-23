import { EngageIcon } from '#root/pages/components/icons/products/engage.svg.jsx'
import { LettersIcon } from '#root/pages/components/icons/products/letters.svg.jsx'
import { OptimiseIcon } from '#root/pages/components/icons/products/optimise.svg.jsx'
import { SendIcon } from '#root/pages/components/icons/products/send.svg.jsx'
import * as ProductCard from '#root/pages/components/products/product-card.jsx'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'

import { route } from '#root/core/shared/routes/route_aliases.js'

function WelcomePage() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 lg:px-0 py-12">
      <div className="mt-24" />
      <div className="border-t kb-border-tertiary py-8">
        <Heading size="xs" variant="display">
          Welcome to Kibamail, <br /> What product would you like to use ?
        </Heading>

        <Text as="p" className="kb-content-tertiary mt-2 max-w-lg">
          Select a product to get started with. Don't worry, you can get started with any
          other product at any time later on.
        </Text>
      </div>
    </div>
  )
}

export { WelcomePage as Page }
