import { ComposeBroadcastTopBar } from '#root/pages/components/flows/compose_broadcast/components/compose_broadcast_top_bar.jsx'
import { useGetBroadcastRecipientsCount } from '#root/pages/components/flows/compose_broadcast/hooks/use_get_broadcast_recipients_count.js'
import { useSyncComposerContentToServer } from '#root/pages/components/flows/compose_broadcast/hooks/use_sync_composer_content_to_server.js'
import { useValidateBroadcastContentMutation } from '#root/pages/components/flows/compose_broadcast/hooks/use_validate_broadcast_content_mutation.js'
import { parseISODateToFormattedScheduleDate } from '#root/pages/components/flows/compose_broadcast/utils/format_schedule_date.js'
import { StepsRenderer } from '#root/pages/components/flows/steps_renderer.jsx'
import {
  usePageContextWithProps,
  usePageProps,
} from '#root/pages/hooks/use_page_props.js'
import { useServerQuery } from '#root/pages/hooks/use_server_query.js'
import type { EngageBroadcastsComposerPageProps } from '#root/pages/w/engage/broadcasts/@uuid/composer/+Page.jsx'
import { route } from '#root/core/shared/routes/route_aliases.js'
import dayjs from 'dayjs'
import React from 'react'
import { clientOnly } from 'vike-react/clientOnly'
import {
  type ComposeBroadcastContextInterface,
  ComposeBroadcastProvider,
} from './state/compose_broadcast_context.jsx'

const StepOneComposer = clientOnly(() =>
  import('./steps/step_one_composer.jsx').then(({ StepOneComposer }) => StepOneComposer),
)

const StepTwoRecipients = clientOnly(() =>
  import('./steps/step_two_recipients.jsx').then(
    ({ StepTwoRecipients }) => StepTwoRecipients,
  ),
)

const StepThreeConfigure = clientOnly(() =>
  import('./steps/step_three_configure.jsx').then(
    ({ StepThreeConfigure }) => StepThreeConfigure,
  ),
)

const StepFivePreview = clientOnly(() =>
  import('./steps/step_five_preview.jsx').then(({ StepFivePreview }) => StepFivePreview),
)

const StepFourTracking = clientOnly(() =>
  import('./steps/step_four_tracking.jsx').then(
    ({ StepFourTracking }) => StepFourTracking,
  ),
)

export function ComposeBroadcastFlow() {
  const {
    pageProps: { broadcast: broadcastFromServer },
  } = usePageContextWithProps<EngageBroadcastsComposerPageProps>()

  const [step, setStep] = React.useState(0)
  const [formState, setFormState] = React.useState<
    ComposeBroadcastContextInterface['formState']
  >({
    segmentId: broadcastFromServer?.segmentId ?? 'all',
    previewText: broadcastFromServer?.emailContent?.previewText ?? '',
    subject: broadcastFromServer?.name ?? '',
    senderIdentityId: broadcastFromServer?.senderIdentityId ?? '',
    trackClicks: broadcastFromServer?.trackClicks ?? false,
    trackOpens: broadcastFromServer?.trackOpens ?? false,
    scheduledAt: broadcastFromServer?.sendAt
      ? parseISODateToFormattedScheduleDate(broadcastFromServer?.sendAt)
      : {
          minute: '00',
          hour: '09',
          ampm: 'AM',
          value: dayjs().add(1, 'day').toDate(),
        },
  })

  const broadcastQuery = useServerQuery({
    queryKey: route('get_broadcast', { uuid: broadcastFromServer.id }),
    initialData: broadcastFromServer,
  })

  const syncContentToServerMutation = useSyncComposerContentToServer({
    currentStep: step,
    setStep,
    mutationOptions: {
      onSuccess() {
        broadcastQuery.refetch()
      },
    },
  })
  const validateBroadcastContentMutation = useValidateBroadcastContentMutation()
  const getBroadcastRecipientsCount = useGetBroadcastRecipientsCount(formState.segmentId)

  return (
    <ComposeBroadcastProvider
      step={step}
      setStep={setStep}
      formState={formState}
      setFormState={setFormState}
      broadcastQuery={broadcastQuery}
      getBroadcastRecipientsCount={getBroadcastRecipientsCount}
      syncContentToServerMutation={syncContentToServerMutation}
      validateBroadcastEmailContentMutation={validateBroadcastContentMutation}
    >
      <div className="w-screen h-screen px-2 pb-2 box-border kb-background-secondary fixed overflow-y-auto top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 focus:outline-none duration-300 ease-out">
        <div className="flex flex-col">
          <ComposeBroadcastTopBar />
          <div className="flex grow w-full h-[calc(100vh-4.25rem)] box-border border kb-border-tertiary rounded-xl kb-background-hover">
            <StepsRenderer
              current={step}
              steps={{
                0: StepOneComposer,
                1: StepTwoRecipients,
                2: StepThreeConfigure,
                3: StepFourTracking,
                4: StepFivePreview,
              }}
            />
          </div>
        </div>
      </div>
    </ComposeBroadcastProvider>
  )
}
