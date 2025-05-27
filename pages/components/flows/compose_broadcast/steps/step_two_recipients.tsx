import { getProgressBarVariant } from '#root/pages/components/dashboard/layout/sidebar/sidebar-content.jsx'
import { DisplayedFilterCondition } from '#root/pages/components/filters/displayed-filter-conditions.jsx'
import { SlashesDivider } from '#root/pages/components/flows/compose_broadcast/components/slashes_divider.jsx'
import { useComposeBroadcastContext } from '#root/pages/components/flows/compose_broadcast/state/compose_broadcast_context.jsx'
import { MinusIcon } from '#root/pages/components/icons/minus.svg.jsx'
import { WarningTriangleSolidIcon } from '#root/pages/components/icons/warning-triangle-solid.svg.jsx'
import { formatCount } from '#root/pages/utils/number_formatter.js'
import type { FilterCondition } from '#root/pages/w/engage/contacts/components/filters.jsx'
import * as Alert from '@kibamail/owly/alert'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Progress } from '@kibamail/owly/progress'
import * as SelectField from '@kibamail/owly/select-field'
import { Spinner } from '@kibamail/owly/spinner'
import { Text } from '@kibamail/owly/text'
import React from 'react'
import type {
  BroadcastPageProps,
  Segment,
} from '#root/pages/types/broadcast-page-props.js'
import { usePageContextWithProps } from '#root/pages/hooks/use_page_props.js'

export function StepTwoRecipients() {
  const {
    pageProps: { segments = [] },
    team,
  } = usePageContextWithProps<BroadcastPageProps>()

  const { formState, setFormState, getBroadcastRecipientsCount } =
    useComposeBroadcastContext('StepTwoRecipients')

  const selectedSegment = segments.find(
    (segment: Segment) => segment.id === formState.segmentId,
  )

  const filters =
    (selectedSegment?.filterGroups?.groups?.flatMap(
      (group: {
        conditions: Array<{
          field: string
          operator: string
          value: string | number | boolean
        }>
      }) =>
        group.conditions.map((condition) => ({
          field: condition.field,
          operation: condition.operator,
          value: condition.value,
        })),
    ) as FilterCondition[]) || []

  function onSelectedSegmentChanged(value: string) {
    setFormState((current) => ({ ...current, segmentId: value }))
  }

  const hasEnoughCredits =
    team?.totalAvailableCredits >= (getBroadcastRecipientsCount?.data?.total ?? 0)

  const additionalCreditsNeeded = hasEnoughCredits
    ? 0
    : (getBroadcastRecipientsCount?.data?.total ?? 0) - team?.totalAvailableCredits

  const percentageOfAdditionalCreditsRequired =
    (additionalCreditsNeeded / team?.totalAvailableCredits) * 100

  const percentageOfCreditsConsumed =
    ((getBroadcastRecipientsCount?.data?.total ?? 0) / team?.totalAvailableCredits) * 100

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

          <SelectField.Content className="relative z-50">
            <SelectField.Item value="all">All contacts</SelectField.Item>
            {segments.map((segment: Segment) => (
              <SelectField.Item key={segment.id} value={segment.id}>
                {segment.name}
              </SelectField.Item>
            ))}
          </SelectField.Content>
        </SelectField.Root>
      </div>

      {filters && filters.length > 0 ? (
        <div className="mt-5 border border-dashed rounded-lg p-4 kb-border-tertiary">
          <div className="flex grow flex-wrap gap-4">
            <DisplayedFilterCondition readOnly filters={filters} />
          </div>
        </div>
      ) : null}

      <SlashesDivider />

      <div className="flex flex-col my-5">
        {hasEnoughCredits ? (
          <Progress
            value={percentageOfCreditsConsumed}
            variant={getProgressBarVariant(percentageOfCreditsConsumed)}
          />
        ) : null}

        {!hasEnoughCredits ? (
          <>
            <div className="flex items-center gap-px">
              <div className="w-full grow">
                <Progress value={100} />
              </div>
              <MinusIcon className="transform rotate-90" />
              <div
                className="w-full"
                style={{ width: `${percentageOfAdditionalCreditsRequired}%` }}
              >
                <Progress value={100} variant="error" />
              </div>
            </div>
            <div className="w-full flex items-center justify-between mb-6">
              <Text size="md" className="kb-content-tertiary flex items-center">
                Using {formatCount(getBroadcastRecipientsCount?.data?.total ?? 0)} email
                credits{' '}
                {getBroadcastRecipientsCount.isLoading ? (
                  <Spinner className="ml-1" />
                ) : null}
              </Text>
              <Text size="md" className="kb-content-tertiary">
                {formatCount(team?.totalAvailableCredits ?? 0)} total email credits
              </Text>
            </div>
          </>
        ) : null}
        {!hasEnoughCredits ? (
          <Alert.Root variant="warning">
            <Alert.Icon>
              <WarningTriangleSolidIcon />
            </Alert.Icon>
            <Alert.Title className="font-semibold">Low on email credits</Alert.Title>
            <Text>
              To send this broadcast, you need an additional{' '}
              {formatCount(additionalCreditsNeeded)} email credits. Please refill your
              email credits before proceedin.
            </Text>
            <Button variant="tertiary" className="pl-0 underline">
              Get more email credits
            </Button>
          </Alert.Root>
        ) : null}
      </div>
    </div>
  )
}
