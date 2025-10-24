import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import React from 'react'
import { useOnboardingContext } from './context_provider.jsx'
import { CreateSendingDomainFlow } from '#root/pages/components/flows/create_sending_domain/create_sending_domain_flow.jsx'

import { route } from '#root/core/shared/routes/route_aliases.js'

export function WriteYourFirstLetterStep() {
  const { step } = useOnboardingContext('CreatePublicationStep')
  const [isTestEmailSent, setIsTestEmailSent] = React.useState(false)

  if (step !== 2) {
    return null
  }

  return (
    <div>
      <Heading variant="display">Compose your first broadcast</Heading>
      <Text className="kb-content-tertiary" as="label" htmlFor="slug">
        Experience the Letters editor, and begin writing your first letter.
      </Text>

      <div className="flex items-center justify-between">
        <Button className="mt-6" asChild>
          <a href={route('engage')}>Compose a broadcast</a>
        </Button>
        <Button variant="tertiary" className="mt-6" asChild>
          <a href={route('engage')}>Skip for now</a>
        </Button>
      </div>

      <div className="mt-8 pt-8 border-t border-gray-200">
        <Heading size="sm" className="mb-2">
          Configure a sending domain
        </Heading>
        <Text className="kb-content-tertiary mb-4">
          Set up a dedicated sending domain for better email deliverability.
        </Text>
        <CreateSendingDomainFlow product="engage">
          <Button disabled={!isTestEmailSent}>Add a sending domain</Button>
        </CreateSendingDomainFlow>
      </div>
    </div>
  )
}
