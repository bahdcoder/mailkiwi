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

      <Text className="kb-content-tertiary font-medium flex flex-col gap-3" as="p">
        <Text>
          Optimise the success of your email efforts, and send emails that reach people,
          not the spam folder.
        </Text>
        <Text>
          The Optimise product provides tools to validate and clean contacts, ensuring
          deliverability and reducing email bounce rates.
        </Text>
        <Text>This product will be part of our initial product launch.</Text>
        <Text>The Optimise product ships with the following features:</Text>
      </Text>

      <Text className="kb-content-tertiary font-medium flex flex-col gap-5">
        <Text className="flex flex-col gap-3" as="p">
          <Heading size="xs" variant="display">
            Features
          </Heading>
          <Heading size={'xs'} variant={'heading'}>
            List validation and cleaning
          </Heading>
          <Text>
            Validate and clean out invalid emails from your audiences. You may also upload
            your list for a one time list validation and cleaning report.
          </Text>
          <Text>
            If you are using our Engage product, we automatically manage validating and
            cleaning your email list to filter out invalid emails so your list stays clean
            and deliverability is always high.
          </Text>
        </Text>

        <Text className="flex flex-col gap-3" as="p">
          <Heading size={'xs'} variant={'heading'}>
            Inbox placement
          </Heading>
          <Text>
            See where your email lands with popular email service providers. Make sure
            your emails would not get into the spam folder before you send your email
            campaigns.
          </Text>
        </Text>

        <Text className="flex flex-col gap-3" as="p">
          <Heading size={'xs'} variant={'heading'}>
            Reputation monitoring
          </Heading>
          <Text>
            Automate the process of monitoring your domain and IP address on popular
            blocklists. Get notified and alerted as fast as possible if we notice any
            domain or IP reputation issues.
          </Text>
        </Text>

        <Text className="flex flex-col gap-3" as="p">
          <Heading size={'xs'} variant={'heading'}>
            Dashboard overview
          </Heading>
          <Text>This is the experience of a customer on the optimise product.</Text>
        </Text>

        <Text className="flex flex-col gap-3" as="p">
          <Heading size={'xs'} variant={'heading'}>
            List validation and cleaning
          </Heading>
          <Text>
            A customer may upload an existing list of email contacts to validate and
            clean.
          </Text>
          <Text>
            First, they upload a list of say 50,000 contacts. We upload this file, queue a
            background job to process and analyse the list. We generate a report showing:
          </Text>
          <ul className="list-inside list-disc gap-3">
            <li>Total valid addresses</li>
            <li>Total invalid addresses</li>
            <li>Estimated bounce rate, based on invalid addresses.</li>
          </ul>
          <Text>
            Also customers may use this product by enabling automatic list cleaning on any
            audience. What will happen is, for every new subscriber, a background job will
            analyse and tag that subscriber based on the result.
          </Text>
          <Text>
            For example, if the email address used is a temporal one, the email may be
            marked as free-host if the email is likely from a free email hosting provider.
          </Text>
        </Text>

        <Text className="flex flex-col gap-3" as="p">
          <Heading size={'xs'} variant={'heading'}>
            Inbox placement
          </Heading>
          <Text>
            This product for a start will be used as part of the email creation process.
            In the email creation flow, the customer may click a button that says
            something like Test inbox placement . This will run a test in the background
            by sending their email to 100 test inboxes.
          </Text>
          <Text>
            In the background, we'll check the test inboxes to see where the customer's
            email landed, such as the Promotions tab, spam folder or similar.
          </Text>
          <Text>We then display a comprehensive report of the placement test.</Text>
        </Text>

        <Text className="flex flex-col gap-3" as="p">
          <Heading size={'xs'} variant={'heading'}>
            Reputation monitoring
          </Heading>
          <Text>
            For every domain the customer adds, we set up automatic reputation monitoring.
            This feature is only triggered when they start sending above 100,000+ emails
            per month.
          </Text>
          <Text>
            Once they do, on their dashboard, they may see their domain and IP reputation
            score, along side other statistics that show the health of their email sending
            reputation.
          </Text>
          <Text>
            Also, they see the status of their domain on popular email sending blacklists.
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

export { OptimizePage as Page }
