import { Divider } from '#root/pages/components/divider/divider.jsx'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'

import { route } from '#root/core/shared/routes/route_aliases.js'

function InsightsPage() {
  return (
    <div className="w-full max-w-2xl mx-auto py-4 lg:py-16 grid grid-cols-1 gap-y-4 p-4">
      <div className="w-full border kb-border-tertiary h-80 kb-background-primary rounded-2xl" />

      <Heading size="xs" variant="display">
        Letters
      </Heading>

      <Text className="kb-content-tertiary font-medium flex flex-col gap-3">
        <Text>
          This platform lets you create a beautiful, customizable website for your
          newsletter with paywalls to monetize content and grow subscribers. It also
          provides tools to write, schedule, and send newsletters, plus manage
          subscriptions, revenue
        </Text>
      </Text>

      <Button className="mt-2" size={'lg'} asChild>
        <a href={route('letters')}>Coming soon...</a>
      </Button>

      <Divider />
    </div>
  )
}

export { InsightsPage as Page }
