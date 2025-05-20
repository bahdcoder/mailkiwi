import { Divider } from '@/pages/components/divider/divider.jsx'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'

import { route } from '@/shared/routes/route_aliases.js'

function MonetizePage() {
  return (
    <div className="w-full max-w-2xl mx-auto py-4 lg:py-16 grid grid-cols-1 gap-y-4 p-4">
      <div className="w-full border kb-border-tertiary h-80 kb-background-primary rounded-2xl" />

      <Heading size="xs" variant="display">
        Monetize
      </Heading>

      <Text className="kb-content-tertiary font-medium flex flex-col gap-3">
        <Text>Monetize your newsletter.</Text>
        <Text>This product will be part of our initial product launch.</Text>
      </Text>

      <Button className="mt-2" size={'lg'} asChild>
        <a href={'#'}>Coming soon...</a>
      </Button>

      <Divider />
    </div>
  )
}

export { MonetizePage as Page }
