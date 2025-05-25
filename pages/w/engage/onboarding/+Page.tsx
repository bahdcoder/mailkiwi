import { ArrowLeftIcon } from '#root/pages/components/icons/arrow-left.svg.jsx'
import {
  type FormState,
  OnboardingProvider,
} from '#root/pages/w/engage/onboarding/steps/context_provider.jsx'
import { CreateBroadcastGroupStep } from '#root/pages/w/engage/onboarding/steps/step_one_create_broadcast_group.jsx'
import { WriteYourFirstLetterStep } from '#root/pages/w/engage/onboarding/steps/step_three_write_your_first_letter.jsx'
import { AddContactsStep } from '#root/pages/w/engage/onboarding/steps/step_two_add_contacts.jsx'
import { Button } from '@kibamail/owly/button'
import { Progress } from '@kibamail/owly/progress'
import '@kibamail/owly/styles/select-field.css'
import { Text } from '@kibamail/owly/text'
import React from 'react'

import { route } from '#root/core/shared/routes/route_aliases.js'

function LettersOnboarding() {
  const [step, setStep] = React.useState(0)
  const [formState, setFormState] = React.useState<FormState>({
    audienceId: '',
    contactImportId: '',
    propertiesMap: {
      email: '',
      firstName: '',
      lastName: '',
    },
  })

  return (
    <OnboardingProvider
      step={step}
      setStep={setStep}
      formState={formState}
      setFormState={setFormState}
    >
      <div className="pr-4 pb-4 pl-2 pt-2">
        <div className="w-full flex items-center">
          <Button asChild variant="tertiary" className="kb-content-primary">
            <a href={route('engage_welcome')}>
              <ArrowLeftIcon />
              Back to onboarding
            </a>
          </Button>
        </div>

        <div className="w-full mt-12 lg:mt-60 mx-auto max-w-120">
          <Text className="kb-content-tertiary-inverse">Step {step + 1} of 3</Text>

          <div className="my-4 flex items-center gap-x-1">
            <Progress value={100} />
            <Progress value={step >= 1 ? 100 : 0} />
            <Progress value={step === 2 ? 100 : 0} />
          </div>

          <CreateBroadcastGroupStep />
          <AddContactsStep />
          <WriteYourFirstLetterStep />
        </div>
      </div>
    </OnboardingProvider>
  )
}

export { LettersOnboarding as Page }
