import { EngageIcon } from '@/pages/components/icons/products/engage.svg.jsx'
import { InsightsIcon } from '@/pages/components/icons/products/insights.svg.jsx'
import { LettersIcon } from '@/pages/components/icons/products/letters.svg.jsx'
import { OptimiseIcon } from '@/pages/components/icons/products/optimise.svg.jsx'
import { SendIcon } from '@/pages/components/icons/products/send.svg.jsx'
import * as ProductCard from '@/pages/components/products/product-card.jsx'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'

import { route } from '@/shared/routes/route_aliases.js'

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-8">
          <ProductCard.Root href={route('engage')}>
            <EngageIcon className="w-10 h-10" />

            <Text size="lg" className="font-semibold">
              Engage
            </Text>

            <Text className="kb-content-tertiary">
              Korem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate
              libero et velit interdum.
            </Text>
          </ProductCard.Root>
          <ProductCard.Root href={route('send')}>
            <SendIcon className="w-10 h-10" />

            <Text size="lg" className="font-semibold">
              Send
            </Text>

            <Text className="kb-content-tertiary">
              Send unlimited transactional emails that are delivered instantly to the
              inbox.
            </Text>
          </ProductCard.Root>

          <ProductCard.Root href={route('optimise')}>
            <OptimiseIcon className="w-10 h-10" />

            <Text size="lg" className="font-semibold">
              Optimise
            </Text>

            <Text className="kb-content-tertiary">
              Korem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate
              libero et velit interdum.
            </Text>
          </ProductCard.Root>

          <ProductCard.Root href={route('insights')}>
            <InsightsIcon className="w-10 h-10" />

            <Text size="lg" className="font-semibold">
              Insights
            </Text>

            <Text className="kb-content-tertiary">
              Korem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate
              libero et velit interdum.
            </Text>
          </ProductCard.Root>

          <ProductCard.Root href={route('send')}>
            <EngageIcon className="w-10 h-10" />

            <Text size="lg" className="font-semibold">
              Monetise
            </Text>

            <Text className="kb-content-tertiary">
              Korem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate
              libero et velit interdum.
            </Text>
          </ProductCard.Root>
        </div>
      </div>
    </div>
  )
}

export { WelcomePage as Page }
