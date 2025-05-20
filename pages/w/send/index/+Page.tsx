import { Divider } from '@/pages/components/divider/divider.jsx'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'

import { route } from '@/shared/routes/route_aliases.js'

function SendPage() {
  return (
    <div className="w-full max-w-2xl mx-auto py-4 lg:py-16 grid grid-cols-1 gap-y-4 p-4">
      <div className="w-full border kb-border-tertiary h-80 kb-background-primary rounded-2xl" />

      <Heading size="xs" variant="display">
        Send
      </Heading>

      <Text className="kb-content-tertiary font-medium flex flex-col gap-3">
        <span>Send, observe and analyse transactional emails at scale.</span>
        <span>This product will be part of our initial product launch.</span>
      </Text>
      <Text className="kb-content-tertiary flex flex-col gap-5">
        <Text as="p" className="flex flex-col gap-3">
          <Heading size="xs" variant="display">
            Features
          </Heading>
          <Heading size={'xs'} variant={'heading'}>
            Send the way you want
          </Heading>
          <span>
            Want to use our no code responsive email builder to create your emails ?
            Great. Block style no code builder ? Of course. Code your emails in React ?
            Also game. API ? SMTP ? We receive your emails however you want to send them.
          </span>
        </Text>

        <Text as="p" className="flex flex-col gap-3">
          <Heading size={'xs'} variant={'heading'}>
            Total visibility
          </Heading>
          <span>
            Inspect and observe everything that happened with your emails. Track clicks,
            opens, bounces and complains by setting up web hooks our your account
            dashboard.
          </span>
        </Text>
        <Text as="p" className="flex flex-col gap-3">
          <Heading size={'xs'} variant={'heading'}>
            Dashboard overview
          </Heading>
          <span>
            This section of the document will provide an overview of the features on the
            dashboard of the send product.
          </span>
          <span>
            The send product provides 1 major features or actions for the customer:
          </span>
        </Text>

        <Text as="p" className="flex flex-col gap-3">
          <Heading size={'xs'} variant={'heading'}>
            Email sending history
          </Heading>
          <span>
            A customer may view a list of all emails sent on their account. For each
            email, they may dig deeper to see an email timeline: a list of events that
            occurred. For example, at Sept 10, 12:34 am, the email was received by us. At
            12:35 am, it was delivered to its destination. At 12:39 am, the email was
            opened. At 12:44 pm, a link was clicked in the email. At 12:49 pm, another
            link was clicked in the email.
          </span>
          <span>
            A user may filter, search and sort emails here. For example, they may want to
            see all their emails that resulted in a bounce or temporal failure event, or
            all emails that resulted in a bounce.
          </span>
        </Text>
      </Text>

      <Button className="mt-2" size={'lg'} asChild>
        <a href={'#'}>Coming soon...</a>
      </Button>

      <Divider />
    </div>
  )
}

export { SendPage as Page }
