import { Divider } from '#root/pages/components/divider/divider.jsx'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'

import { route } from '#root/core/shared/routes/route_aliases.js'

function SendPage() {
  return (
    <div className="w-full max-w-2xl mx-auto py-4 lg:py-16 grid grid-cols-1 gap-y-4 p-4">
      <div className="w-full border kb-border-tertiary h-80 kb-background-primary rounded-2xl" />

      <Heading size="xs" variant="display">
        Send
      </Heading>

      <Text className="kb-content-tertiary font-medium flex flex-col gap-3">
        Send, track, and analyze transactional emails at scale using no-code builders,
        React, API, or SMTP. It provides full visibility into email performance with
        detailed analytics on opens, clicks, bounces, and complaints, along with a
        searchable history of sent emails.
      </Text>

      <Button className="mt-2" size={'lg'} asChild>
        <a href={route('send')}>Coming soon...</a>
      </Button>

      <Divider />
    </div>
  )
}

export { SendPage as Page }
