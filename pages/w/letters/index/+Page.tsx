import { Divider } from '@/pages/components/divider/divider.jsx'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'

import { route } from '@/shared/routes/route_aliases.js'

function InsightsPage() {
  return (
    <div className="w-full max-w-2xl mx-auto py-4 lg:py-16 grid grid-cols-1 gap-y-4 p-4">
      <div className="w-full border kb-border-tertiary h-80 kb-background-primary rounded-2xl" />

      <Heading size="xs" variant="display">
        Letters
      </Heading>

      <Text className="kb-content-tertiary font-medium flex flex-col gap-3">
        <Text>
          Letters is an all-in-one tool to build, grow and monetize your newsletter.
        </Text>
        <Text>This product will be part of our initial product launch.</Text>
      </Text>

      <Text className="kb-content-tertiary font-medium flex flex-col gap-5">
        <Text className="flex flex-col gap-3" as="p">
          <Heading size="xs" variant="display">
            Features
          </Heading>
          <Heading size={'xs'} variant={'heading'}>
            Your own beautiful website
          </Heading>
          <Text>
            Create a beautiful website for your newsletter. Add a paywall, grow your
            newsletter subscribers and revenue.
          </Text>
        </Text>

        <Text className="flex flex-col gap-3" as="p">
          <Heading size={'xs'} variant={'heading'}>
            Monetise your newsletter content
          </Heading>
          <Text>
            Sell a membership subscription to your newsletter, and keep 100% of your
            revenue. Add paywalls to show premium content only to subscribers.
          </Text>
        </Text>

        <Text className="flex flex-col gap-3" as="p">
          <Heading size={'xs'} variant={'heading'}>
            Dashboard overview
          </Heading>
          <Text>
            This document documents the journey of a customer on the Letters product's
            dashboard. A customer on this product can perform 3 main actions:
          </Text>
        </Text>

        <Text className="flex flex-col gap-3" as="p">
          <Heading size={'xs'} variant={'heading'}>
            Write
          </Heading>
          <Text>
            A customer can write a letter and hit send or schedule the newsletter for
            delivery at a later date. This sends an email to all their newsletter
            subscribers. You may have guessed that this is exactly the same workflow or
            feature as broadcasts from the Engage product. That is correct.
          </Text>
          <Text>
            We want both experiences to be almost exactly the same journey. But, we want
            to make sure we create a separate project for branding and marketing purposes.
            It's much easier to sell by saying
            <q className="mx-1 bg-gray-100">
              We have a dedicated product called Letters for your newsletters
            </q>
            than saying
            <q className="mx-1 bg-gray-100">
              You may also use our Engage product for newsletter.
            </q>
          </Text>
          <Text>
            Our UX solution in this case would find a way to provide the exact same
            editing and creating experience like with broadcasts, but still having them be
            2 separate products.
          </Text>
        </Text>

        <Text className="flex flex-col gap-3" as="p">
          <Heading size={'xs'} variant={'heading'}>
            Monetise
          </Heading>
          <Text>
            A customer may sell their newsletter as a monthly subscription or as a one
            time fee. For example, my newsletter has a senior and professional plan.
            Senior plan members get access to 2 newsletters a week, while professional
            plan members get access to 1 new book a month in addition to my newsletters.
          </Text>

          <Text>
            I may also see details on how much revenue I have made, connect a payout
            source like Stripe or Paystack, and manage my newsletter paid or free
            subscribers. Newsletter subscribers are just going to be contacts in an
            audience which can be filtered, searched, and segmented. This is also a UI
            problem we have to figure out, as the Letters product is just a wrapper around
            the Engage product, providing monetisation and a website.
          </Text>
        </Text>

        <Text className="flex flex-col gap-3" as="p">
          <Heading size={'xs'} variant={'heading'}>
            Publication website
          </Heading>
          <Text>
            This features a website builder like the Wordpress Gutenberg Editor, or Koenig
            Ghost Editor, allowing creators build a website, list all their publications,
            grow their newsletter, and sell newsletter subscription plans.
          </Text>
        </Text>
      </Text>

      <Button className="mt-2" size={'lg'} asChild>
        <a href={'#'}>Coming soon...</a>
      </Button>

      <Divider />
    </div>
  )
}

export { InsightsPage as Page }
