import { DisplayedFilterCondition } from '@/pages/components/filters/displayed-filter-conditions.jsx'
import { useComposeBroadcastContext } from '@/pages/components/flows/compose_broadcast/state/compose_broadcast_context.jsx'
import { MinusIcon } from '@/pages/components/icons/minus.svg.jsx'
import { WarningTriangleSolidIcon } from '@/pages/components/icons/warning-triangle-solid.svg.jsx'
import { EngagePageProps } from '@/pages/w/engage/+Page.jsx'
import type { EngageBroadcastsComposerPageProps } from '@/pages/w/engage/broadcasts/@uuid/composer/+Page.jsx'
import { FilterCondition } from '@/pages/w/engage/contacts/components/filters.jsx'
import * as Alert from '@kibamail/owly/alert'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Progress } from '@kibamail/owly/progress'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import React from 'react'
import { usePageContext } from 'vike-react/usePageContext'

export function StepThreeConfigure() {
  const ctx = usePageContext()

  const { formState, setFormState } = useComposeBroadcastContext('StepThreeConfigure')
  const pageProps = ctx.pageProps as EngageBroadcastsComposerPageProps

  const engageSendingDomain = ctx.sendingDomains.find(
    (domain) => domain.product === 'engage',
  )

  return (
    <div className="w-full max-w-[480px] mx-auto pt-16">
      <Heading>Email settings</Heading>

      <Text className="kb-content-tertiary mt-2">
        Define the email content for this broadcast
      </Text>

      <div className="grid grid-cols-1 gap-6 mt-6">
        <TextField.Root
          value={formState.subject}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              subject: event.target.value,
            }))
          }
        >
          <TextField.Label>Subject</TextField.Label>
        </TextField.Root>

        <TextField.Root
          value={formState.previewText}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              previewText: event.target.value,
            }))
          }
        >
          <TextField.Label>Preview text</TextField.Label>
        </TextField.Root>
      </div>

      <div className="w-full flex gap-2 h-6 overflow-x-hidden my-5">
        {new Array(50).fill(0).map((_slash, idx) => (
          <div
            key={idx}
            className=" h-full w-px bg-[var(--border-tertiary)] transform rotate-45"
          />
        ))}
      </div>

      <div className="mt-6">
        <Heading size="xs">Sender details</Heading>

        <Text className="kb-content-tertiary mt-2">
          Choose the email address that will be used to send this broadcast
        </Text>
      </div>

      {engageSendingDomain ? (
        <div className="mt-6 grid grid-cols-1 gap-4">
          <TextField.Root
            value={formState.fromEmail}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                fromEmail: event.target.value,
              }))
            }
          >
            <TextField.Label>From email</TextField.Label>
            <TextField.Slot side="right">
              <Text>@{engageSendingDomain?.name}</Text>
            </TextField.Slot>
          </TextField.Root>

          <TextField.Root
            value={formState.fromName}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                fromName: event.target.value,
              }))
            }
          >
            <TextField.Label>From name</TextField.Label>
          </TextField.Root>

          <TextField.Root
            type="email"
            value={formState.replyToEmail}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                replyToEmail: event.target.value,
              }))
            }
          >
            <TextField.Label>Reply to</TextField.Label>
          </TextField.Root>
        </div>
      ) : null}

      {!engageSendingDomain ? (
        <div className="mt-6">
          <Alert.Root variant="warning">
            <Alert.Icon>
              <WarningTriangleSolidIcon />
            </Alert.Icon>
            <Alert.Title className="font-semibold">
              Configure a sending domain
            </Alert.Title>
            <Text>
              To maintain high deliverability rates and build your own sender reputation,
              please setup at least one custom sending domain for this team.
            </Text>
            <Button variant="tertiary" className="pl-0 underline">
              Configure domain
            </Button>
          </Alert.Root>
        </div>
      ) : null}
    </div>
  )
}
