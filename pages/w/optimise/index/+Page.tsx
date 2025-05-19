import { Divider } from '@/pages/components/divider/divider.jsx'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'

import { route } from '@/shared/routes/route_aliases.js'

function OptimizePage() {
  return (
    <div className="w-full max-w-2xl mx-auto py-4 lg:py-16 grid grid-cols-1 gap-y-4 p-4">
      <div className="w-full border kb-border-tertiary h-80 kb-background-primary rounded-2xl" />

      <Heading size="xs" variant="display">
        Optimize
      </Heading>

      <Text className="kb-content-tertiary font-medium">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Provident similique earum
        dicta repudiandae possimus expedita exercitationem quis odit minima dolore illo.
      </Text>

      <Button className="mt-2" size={'lg'} asChild>
        <a href={'#'}>Coming soon...</a>
      </Button>

      <Divider />
    </div>
  )
}

export { OptimizePage as Page }
