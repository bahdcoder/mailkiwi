import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import { OnboardingStep } from './components/onboarding-step.jsx'
import { Button } from '@kibamail/owly/button'
import { SdkCodeSnippets } from '#root/pages/components/sdk-code-snippets/sdk-code-snippets.jsx'
import { useData } from 'vike-react/useData'

function SendOnboardingPage() {
  const { email, sdks } = useData<{
    email: string
    sdks: { name: string; code: string }[]
  }>()

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-3xl mx-auto mt-20">
        <Heading size="xs" variant="display" className="mb-5">
          Setup transactional email sending
        </Heading>
        <Text className="kb-content-tertiary">
          Create an api key, and connect one of our supported SDKs to start sending
          transactional email from your applications.
        </Text>

        <div className="mt-6 flex flex-col w-full gap-8 relative">
          <div className="h-1" />
          <div className="absolute w-px h-full left-[7.5px] bg-(--border-tertiary)">
            <div className="kb-background-info w-px" style={{ height: '75%' }} />
          </div>
          <OnboardingStep
            title="Generate an api key"
            description="Your api key may be used to send emails using an SDK, SMTP or interact
          with our API."
            completed
          >
            <Button>Generate api key</Button>
          </OnboardingStep>

          <OnboardingStep
            completed
            title="Send a test email"
            description={`We'll send an email to your registered email address using your created api key.`}
          >
            <SdkCodeSnippets footer={<Button>Send email</Button>} sdks={sdks} />
          </OnboardingStep>

          <OnboardingStep
            title="Configure a sending domain"
            description={
              'For email best practices, please set up a dedicated sending domain for your transactional emails.'
            }
          >
            <div className="flex gap-4 items-center">
              <Button disabled>Add a sending domain</Button>
              <Button variant="tertiary">I'll do this later</Button>
            </div>
          </OnboardingStep>

          <div className="h-1" />
        </div>
      </div>
    </div>
  )
}

export { SendOnboardingPage as Page }
