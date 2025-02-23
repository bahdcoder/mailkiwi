import { DisplayedFilterCondition } from '@/pages/components/filters/displayed-filter-conditions.jsx'
import { useComposeBroadcastContext } from '@/pages/components/flows/compose_broadcast/state/compose_broadcast_context.jsx'
import { MinusIcon } from '@/pages/components/icons/minus.svg.jsx'
import { WarningTriangleSolidIcon } from '@/pages/components/icons/warning-triangle-solid.svg.jsx'
import type { EngageBroadcastsComposerPageProps } from '@/pages/w/engage/broadcasts/@uuid/composer/+Page.jsx'
import type { FilterCondition } from '@/pages/w/engage/contacts/components/filters.jsx'
import * as Alert from '@kibamail/owly/alert'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Progress } from '@kibamail/owly/progress'
import * as SelectField from '@kibamail/owly/select-field'
import { Spinner } from '@kibamail/owly/spinner'
import { Text } from '@kibamail/owly/text'
import React from 'react'
import { usePageContext } from 'vike-react/usePageContext'

export function StepTwoRecipients() {
  const ctx = usePageContext()

  const { formState, setFormState, getBroadcastRecipientsCount } =
    useComposeBroadcastContext('StepTwoRecipients')

  const pageProps = ctx.pageProps as EngageBroadcastsComposerPageProps

  const selectedSegment = pageProps.segments.find(
    (segment) => segment.id === formState.segmentId,
  )

  const filters = selectedSegment?.filterGroups?.groups?.flatMap(
    (group) => group.conditions,
  ) as FilterCondition[]

  function onSelectedSegmentChanged(value: string) {
    setFormState((current) => ({ ...current, segmentId: value }))
  }

  return (
    <div className="w-full max-w-[480px] mx-auto pt-16">
      <Heading>Send broadcast to contacts</Heading>

      <div className="mt-2">
        <Text className="kb-content-tertiary">
          Select the contacts that will receive this broadcast. You may send to all your
          contacts, or to a segment of your audience.
        </Text>
      </div>

      <div className="mt-5">
        <SelectField.Root
          value={formState.segmentId}
          onValueChange={onSelectedSegmentChanged}
        >
          <SelectField.Label>Send to</SelectField.Label>

          <SelectField.Trigger />

          <SelectField.Content className="relative z-[50]">
            <SelectField.Item value="all">All contacts</SelectField.Item>
            {pageProps.segments.map((segment) => (
              <SelectField.Item key={segment.id} value={segment.id}>
                {segment.name}
              </SelectField.Item>
            ))}
          </SelectField.Content>
        </SelectField.Root>
      </div>

      {filters && filters.length > 0 ? (
        <div className="mt-5 border border-dashed rounded-lg p-4 kb-border-tertiary">
          <div className="flex flex-grow flex-wrap gap-4">
            <DisplayedFilterCondition readOnly filters={filters} />
          </div>
        </div>
      ) : null}

      <div className="w-full flex gap-2 h-6 overflow-x-hidden my-5">
        {new Array(50).fill(0).map((_slash, idx) => (
          <div
            key={idx}
            className=" h-full w-px bg-[var(--border-tertiary)] transform rotate-45"
          />
        ))}
      </div>

      <div className="flex flex-col my-5">
        <Progress value={73} />
        <div className="w-full flex items-center justify-between mt-2">
          <Text size="md" className="kb-content-tertiary flex items-center">
            Using {getBroadcastRecipientsCount?.data?.total} email credits{' '}
            {getBroadcastRecipientsCount.isLoading ? <Spinner className="ml-1" /> : null}
          </Text>
          <Text size="md" className="kb-content-tertiary">
            23,009 total email credits
          </Text>
        </div>
        {false ? (
          <>
            <div className="flex items-center gap-px">
              <Progress value={100} />
              <MinusIcon className="transform rotate-90" />
              <Progress value={100} variant="error" />
            </div>
          </>
        ) : null}
      </div>

      {false ? (
        <Alert.Root variant="warning">
          <Alert.Icon>
            <WarningTriangleSolidIcon />
          </Alert.Icon>
          <Alert.Title className="font-semibold">Low on email credits</Alert.Title>
          <Text>
            To send this broadcast, you need an additional 23,000 email credits. Please
            refill your email credits before proceedin.
          </Text>
          <Button variant="tertiary" className="pl-0 underline">
            Get more email credits
          </Button>
        </Alert.Root>
      ) : null}
    </div>
  )
}
