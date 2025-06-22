import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import { OnboardingStep } from './components/onboarding-step.jsx'
import { Button } from '@kibamail/owly/button'
import { SdkCodeSnippets } from '#root/pages/components/sdk-code-snippets/sdk-code-snippets.jsx'
import { useData } from 'vike-react/useData'
import { usePageContext } from 'vike-react/usePageContext'
import { useGenerateApiKey } from './hooks/use-generate-api-key.jsx'
import { useSendTestEmail } from './hooks/use-send-test-email.jsx'
import { PasswordField } from '#root/pages/components/input/password-field.jsx'
import { CopyIcon } from '#root/pages/components/icons/copy.svg.jsx'
import { CheckCircleSolidIcon } from '#root/pages/components/icons/check-circle-solid.svg.jsx'
import * as TextField from '@kibamail/owly/text-field'
import * as Alert from '@kibamail/owly/alert'
import React from 'react'
import { CreateSendingDomainFlow } from '#root/pages/components/flows/create_sending_domain/create_sending_domain_flow.jsx'
import { route } from '#root/core/shared/routes/route_aliases'

function SendOnboardingPage() {
  const { email, sdks } = useData<{
    email: string
    sdks: { name: string; code: string }[]
  }>()
  const { team } = usePageContext()
  const {
    generateApiKey,
    copyApiKey,
    isPending,
    data: apiKeyData,
    isSuccess: isGeneratedApiKeySuccess,
  } = useGenerateApiKey(`${team.name} onboarding`, 'full')

  const {
    sendTestEmail,
    isPending: isSendingTestEmail,
    isSuccess: isTestEmailSent,
  } = useSendTestEmail()

  let percentageCompleted = 0

  if (isGeneratedApiKeySuccess) {
    percentageCompleted = percentageCompleted + 33
  }

  if (isTestEmailSent) {
    percentageCompleted = percentageCompleted + 51
  }

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
            <div
              className="kb-background-info w-px transition-all duration-500 ease-out"
              style={{ height: `${percentageCompleted}%` }}
            />
          </div>
          <OnboardingStep
            title="Generate an api key"
            description="Your api key may be used to send emails using an SDK, SMTP or interact
          with our API."
            completed={isGeneratedApiKeySuccess}
          >
            {!apiKeyData?.payload?.apiKey ? (
              <Button onClick={generateApiKey} disabled={isPending}>
                {isPending ? 'Generating...' : 'Generate api key'}
              </Button>
            ) : (
              <div className="flex flex-col gap-3">
                <PasswordField
                  readOnly
                  strengthIndicator={false}
                  value={apiKeyData.payload.apiKey}
                >
                  <TextField.Label>API Key</TextField.Label>
                </PasswordField>
                <Button onClick={copyApiKey} variant="secondary">
                  <CopyIcon className="w-4 h-4 mr-2" />
                  Copy API key
                </Button>
              </div>
            )}
          </OnboardingStep>

          <OnboardingStep
            title="Send a test email"
            description={`We'll send an email to your registered email address using your created api key.`}
            completed={isTestEmailSent}
          >
            <SdkCodeSnippets
              footer={
                isTestEmailSent ? (
                  <Alert.Root variant="success">
                    <Alert.Icon>
                      <CheckCircleSolidIcon />
                    </Alert.Icon>
                    <Alert.Title>
                      Test email sent successfully! Check your email inbox to see the
                      received email.
                    </Alert.Title>
                  </Alert.Root>
                ) : (
                  <Button
                    onClick={sendTestEmail}
                    loading={isSendingTestEmail}
                    disabled={!isGeneratedApiKeySuccess}
                  >
                    Send your first email
                  </Button>
                )
              }
              sdks={sdks}
            />
          </OnboardingStep>

          <OnboardingStep
            title="Configure a sending domain"
            description={
              'For email best practices, please set up a dedicated sending domain for your transactional emails.'
            }
          >
            <div className="flex gap-4 items-center">
              <CreateSendingDomainFlow product="send">
                <Button disabled={!isTestEmailSent}>Add a sending domain</Button>
              </CreateSendingDomainFlow>
              <Button variant="tertiary" asChild>
                <a href={route('send')}>I'll do this later</a>
              </Button>
            </div>
          </OnboardingStep>

          <div className="h-1" />
        </div>
      </div>
    </div>
  )
}

export { SendOnboardingPage as Page }
