import { DisplayedFilterCondition } from "@/pages/components/filters/displayed-filter-conditions.jsx"
import { useComposeBroadcastContext } from "@/pages/components/flows/compose_broadcast/state/compose_broadcast_context.jsx"
import { MinusIcon } from "@/pages/components/icons/minus.svg.jsx"
import { WarningCircleIcon } from "@/pages/components/icons/warning-circle-solid.svg.jsx"
import { WarningTriangleSolidIcon } from "@/pages/components/icons/warning-triangle-solid.svg.jsx"
import { RadioGroupCardItem } from "@/pages/components/radio-group/radio-group-card-item.jsx"
import { EngagePageProps } from "@/pages/w/engage/+Page.jsx"
import { EngageBroadcastsComposerPageProps } from "@/pages/w/engage/broadcasts/@uuid/composer/+Page.jsx"
import { FilterCondition } from "@/pages/w/engage/contacts/components/filters.jsx"
import * as Alert from "@kibamail/owly/alert"
import { Button } from "@kibamail/owly/button"
import { Heading } from "@kibamail/owly/heading"
import { Progress } from "@kibamail/owly/progress"
import { Text } from "@kibamail/owly/text"
import * as TextField from "@kibamail/owly/text-field"
import React from "react"
import { usePageContext } from "vike-react/usePageContext"

export function StepFourTracking() {
  const ctx = usePageContext()
  const { formState, setFormState } = useComposeBroadcastContext("StepFourTracking")

  const engageSendingDomain = ctx.sendingDomains.find(
    (domain) => domain.product === "engage",
  )

  return (
    <div className="w-full max-w-[480px] mx-auto pt-16">
      <Heading>Tracking settings</Heading>

      <Text className="kb-content-tertiary mt-2">
        Enable link and open tracking in your emails
      </Text>

      {engageSendingDomain?.trackingDomainVerifiedAt ? (
        <div className="grid grid-cols-1 gap-4 mt-6">
          <RadioGroupCardItem
            title="Enable open tracking"
            checked={formState.trackOpens}
            onClick={() =>
              setFormState((current) => ({ ...current, trackOpens: !current.trackOpens }))
            }
            className="cursor-pointer"
            description="Not always recommended."
          >
            <Alert.Root variant="feature" className="mt-4 -ml-6">
              <Alert.Icon>
                <WarningCircleIcon />
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
            onClick={() =>
              setFormState((current) => ({
                ...current,
                trackClicks: !current.trackClicks,
              }))
            }
            description="Get metrics for everytime a contact clicks on your email."
          >
            <Alert.Root variant="feature" className="mt-4 -ml-6">
              <Alert.Icon>
                <WarningCircleIcon />
              </Alert.Icon>
              <Alert.Title className="text-left flex flex-col">
                <span>
                  To track clicks, we'll replace every link in your email to track clicks,
                  and immediately redirect users to the intended destination.{" "}
                </span>
              </Alert.Title>
            </Alert.Root>
          </RadioGroupCardItem>
        </div>
      ) : null}
    </div>
  )
}
