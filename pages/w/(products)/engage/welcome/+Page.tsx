import { Divider } from '#root/pages/components/divider/divider.jsx'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'

import { route } from '#root/core/shared/routes/route_aliases.js'

function LettersWelcomePage() {
  return (
    <div className="w-full max-w-2xl mx-auto py-4 lg:py-16 grid grid-cols-1 gap-y-4 p-4">
      <div className="w-full border kb-border-tertiary h-80 kb-background-primary rounded-2xl" />

      <Heading size="xs" variant="display">
        Engage
      </Heading>

      <Text className="kb-content-tertiary font-medium">
        Grow your revenue with email and automation.
        <br />
        Engage helps you send and automate marketing emails that convert.
      </Text>

      <Button className="mt-2" size={'lg'} asChild>
        <a href={route('engage_onboarding')}>Get started</a>
      </Button>

      <Divider />
    </div>
  )
}

export { LettersWelcomePage as Page }
