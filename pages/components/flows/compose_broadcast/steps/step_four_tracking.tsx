import type { SendingDomain } from '#root/database/database_schema_types.js'
import { useComposeBroadcastContext } from '#root/pages/components/flows/compose_broadcast/state/compose_broadcast_context.jsx'
import { WarningCircleSolidIcon } from '#root/pages/components/icons/warning-circle-solid.svg.jsx'
import { WarningTriangleSolidIcon } from '#root/pages/components/icons/warning-triangle-solid.svg.jsx'
import { RadioGroupCardItem } from '#root/pages/components/radio-group/radio-group-card-item.jsx'
import { usePageContextWithProps } from '#root/pages/hooks/use_page_props.js'
import * as Alert from '@kibamail/owly/alert'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import React from 'react'

export function StepFourTracking() {
  const { pageProps: ctx } = usePageContextWithProps<{
    sendingDomains: SendingDomain[]
  }>()
  const { formState, setFormState } = useComposeBroadcastContext('StepFourTracking')

  const engageSendingDomain = ctx.sendingDomains.find(
    (domain) => domain.product === 'engage',
  )

  const trackingDomainVerified = !!engageSendingDomain?.trackingDomainVerifiedAt

  return (
    <div className="w-full max-w-[480px] mx-auto pt-16">
      <Heading>Tracking settings</Heading>

      <Text className="kb-content-tertiary mt-2">
        Enable link and open tracking in your emails
      </Text>

      {!trackingDomainVerified ? (
        <div className="my-6">
          <Alert.Root variant="warning">
            <Alert.Icon>
              <WarningTriangleSolidIcon />
            </Alert.Icon>
            <Alert.Title className="font-semibold">
              Configure a sending domain
            </Alert.Title>
            <Text>
              To enable tracking, please set up a sending domain. This process will also
              guide you on how to set up a unique tracking domain for your brand.
            </Text>
            <Button variant="tertiary" className="pl-0 underline">
              Configure domain
            </Button>
          </Alert.Root>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 mt-6">
        <RadioGroupCardItem
          title="Enable open tracking"
          checked={formState.trackOpens}
          disabled={!trackingDomainVerified}
          onClick={() => {
            if (!trackingDomainVerified) {
              return
            }
            setFormState((current) => ({
              ...current,
              trackOpens: !current.trackOpens,
            }))
          }}
          className="cursor-pointer"
          description="Not always recommended."
        >
          <Alert.Root variant="feature" className="mt-4 -ml-6">
            <Alert.Icon>
              <WarningCircleSolidIcon />
            </Alert.Icon>
            <Alert.Title className="text-left flex flex-col gap-1">
              <span>
                To track opens, we'll insert a tracking pixel at the end of your email.
              </span>
              <span>
                This may produce inaccurate results based on the inbox of your contacts.
              </span>
            </Alert.Title>
          </Alert.Root>
        </RadioGroupCardItem>
        <RadioGroupCardItem
          checked={formState.trackClicks}
          title="Enable click tracking"
          className="cursor-pointer"
          disabled={!trackingDomainVerified}
          onClick={() => {
            if (!trackingDomainVerified) {
              return
            }
            setFormState((current) => ({
              ...current,
              trackClicks: !current.trackClicks,
            }))
          }}
          description="Get metrics for everytime a contact clicks on your email."
        >
          <Alert.Root variant="feature" className="mt-4 -ml-6">
            <Alert.Icon>
              <WarningCircleSolidIcon />
            </Alert.Icon>
            <Alert.Title className="text-left flex flex-col">
              <span>
                To track clicks, we'll replace every link in your email to track clicks,
                and immediately redirect users to the intended destination.{' '}
              </span>
            </Alert.Title>
          </Alert.Root>
        </RadioGroupCardItem>
      </div>
    </div>
  )
}
