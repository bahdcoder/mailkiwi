import './compose_broadcast_top_bar_actions.styles.css'
import { CancelScheduledBroadcast } from '#root/pages/components/flows/compose_broadcast/components/compose_broadcast_cancel_scheduled_broadcast.jsx'
import { ComposeBroadcastSteps } from '#root/pages/components/flows/compose_broadcast/compose_broadcast_types.js'
import { useComposeBroadcastContext } from '#root/pages/components/flows/compose_broadcast/state/compose_broadcast_context.jsx'
import {
  SCHEDULED_DATE_READABLE_FORMAT,
  type ScheduleDateTime,
  scheduledDateTimeToDayJsInstance,
} from '#root/pages/components/flows/compose_broadcast/utils/format_schedule_date.js'
import { ArrowRightIcon } from '#root/pages/components/icons/arrow-right.svg.jsx'
import { CalendarIcon } from '#root/pages/components/icons/calendar.jsx'
import { InfoCircleIcon } from '#root/pages/components/icons/info-circle.svg.jsx'
import * as Popover from '#root/pages/components/popover/popover.jsx'
import { RadioGroupCardItem } from '#root/pages/components/radio-group/radio-group-card-item.jsx'
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { navigate } from '#root/pages/utils/navigate.js'
import * as Alert from '@kibamail/owly/alert'
import { Button } from '@kibamail/owly/button'
import { Calendar } from '@kibamail/owly/calendar'
import * as Dialog from '@kibamail/owly/dialog'
import * as SelectField from '@kibamail/owly/select-field'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat.js'
import React from 'react'
import { toast } from 'sonner'
import type { BroadcastPageProps } from '#root/pages/types/broadcast-page-props.js'

import { route } from '#root/core/shared/routes/route_aliases.js'
import { usePageContextWithProps } from '#root/pages/hooks/use_page_props.js'

dayjs.extend(advancedFormat)

export function ComposeBroadcastTopBarActions() {
  const { step } = useComposeBroadcastContext('ComposeBroadcastTopBarActions')

  switch (step) {
    case ComposeBroadcastSteps.COMPOSE:
      return <ComposeStepActions />
    case ComposeBroadcastSteps.CONTACTS:
      return <ContactsStepActions />
    case ComposeBroadcastSteps.CONFIGURE:
      return <ConfigureStepActions />
    case ComposeBroadcastSteps.PREVIEW:
      return <PreviewStepActions />
    case ComposeBroadcastSteps.TRACKING:
      return <TrackingStepActions />
    default:
      return null
  }
}

export function ComposeStepActions() {
  const { syncContentToServerMutation, setStep } =
    useComposeBroadcastContext('ComposeStepActions')

  return (
    <div className="flex items-center gap-4">
      <Button
        disabled={syncContentToServerMutation.isPending}
        onClick={() => setStep(ComposeBroadcastSteps.CONTACTS)}
      >
        Next <ArrowRightIcon />
      </Button>
    </div>
  )
}

export function ContactsStepActions() {
  const { syncContentToServerMutation, formState } =
    useComposeBroadcastContext('ContactsStepActions')

  async function onNextClicked() {
    await syncContentToServerMutation.mutateAsync({
      segmentId: formState.segmentId === 'all' ? null : formState.segmentId,
    })
  }

  return (
    <div className="flex items-center gap-4">
      <Button loading={syncContentToServerMutation.isPending} onClick={onNextClicked}>
        Next <ArrowRightIcon />
      </Button>
    </div>
  )
}

export function ConfigureStepActions() {
  const { syncContentToServerMutation, formState } =
    useComposeBroadcastContext('ContactsStepActions')

  async function onNextClicked() {
    const emailContent: Record<string, string> = {
      subject: formState.subject,
      previewText: formState.previewText,
    }

    // Sender identity is now used instead of direct email fields

    await syncContentToServerMutation.mutateAsync({
      emailContent,
    })
  }

  return (
    <div className="flex items-center gap-4">
      <Button loading={syncContentToServerMutation.isPending} onClick={onNextClicked}>
        Next <ArrowRightIcon />
      </Button>
    </div>
  )
}

export function TrackingStepActions() {
  const { syncContentToServerMutation, formState } =
    useComposeBroadcastContext('TrackingStepActions')

  async function onNextClicked() {
    await syncContentToServerMutation.mutateAsync({
      trackClicks: formState.trackClicks,
      trackOpens: formState.trackOpens,
    })
  }

  return (
    <div className="flex items-center gap-4">
      <Button loading={syncContentToServerMutation.isPending} onClick={onNextClicked}>
        Next <ArrowRightIcon />
      </Button>
    </div>
  )
}

export function PreviewStepActions() {
  const {
    pageProps: { broadcast },
    routeParams,
  } = usePageContextWithProps<BroadcastPageProps>()
  const { getBroadcastRecipientsCount, formState, setFormState } =
    useComposeBroadcastContext('PreviewStepActions')

  function setScheduleAt(scheduledAt: ScheduleDateTime) {
    setFormState((current) => ({ ...current, scheduledAt }))
  }

  const [schedule, setSchedule] = React.useState<'now' | 'later'>('later')

  const minutes = React.useMemo(() => {
    const minutes = ['00', '15', '30', '45']

    return minutes
  }, [])

  const hours = React.useMemo(() => {
    const hours = []
    for (let i = 1; i <= 12; i++) {
      const hour = i.toString().padStart(2, '0')
      hours.push(hour)
    }
    return hours
  }, [])

  const selectedDate = dayjs(formState.scheduledAt.value).format('MMM Do, YYYY')

  const scheduledDate = scheduledDateTimeToDayJsInstance(formState.scheduledAt)

  const formattedScheduledDate = scheduledDateTimeToDayJsInstance(
    formState.scheduledAt,
  ).format(SCHEDULED_DATE_READABLE_FORMAT)

  const minimumDate = dayjs().toDate()

  const { serverFormProps, isPending, ServerErrorsList } = useServerFormMutation({
    action: route('send_broadcast', { uuid: routeParams.uuid }),
    onSuccess() {
      toast.success('Broadcast has been scheduled for publish.')

      navigate(route('broadcasts'))
    },
    transform() {
      return {
        sendAt: scheduledDate.toISOString(),
      }
    },
  })

  const isQueuedForSending = broadcast?.status === 'QUEUED_FOR_SENDING'

  return (
    <div className="flex items-center gap-4">
      {isQueuedForSending ? (
        <CancelScheduledBroadcast sendAt={formattedScheduledDate} />
      ) : null}
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <Button>
            {isQueuedForSending ? 'Update schedule' : 'Schedule'} <ArrowRightIcon />
          </Button>
        </Dialog.Trigger>

        <Dialog.Content>
          <Dialog.Header className="items-center border-b-transparent">
            <Dialog.Title>Schedule publish time</Dialog.Title>
            <Dialog.Description>
              Pick a time to publish your broadcast.
            </Dialog.Description>
          </Dialog.Header>

          <div className="px-6 py-4 pb-6">
            <div className="grid grid-cols-1 gap-4 ">
              <RadioGroupCardItem
                disabled
                title="Send now"
                description={`Immediately send this broadcasts to ${getBroadcastRecipientsCount?.data?.total} contacts`}
                onClick={() => setSchedule('now')}
                checked={schedule === 'now'}
              />
              <RadioGroupCardItem
                checked={schedule === 'later'}
                title="Schedule for later"
                description={`Send this broadcast to ${getBroadcastRecipientsCount?.data?.total} contacts at a later date.`}
                onClick={() => setSchedule('later')}
              >
                <div className="w-[calc(100%+1.5rem)] flex flex-col lg:flex-row lg:items-center mt-4 gap-4 -ml-6 cursor-default">
                  <div className="w-full lg:w-5/12">
                    <Popover.Root>
                      <Popover.Trigger asChild>
                        <TextField.Root
                          readOnly
                          value={selectedDate}
                          className="w-full text-left kb-calendar-input"
                        >
                          <TextField.Slot side="right">
                            <CalendarIcon className="w-4 h-4" />
                          </TextField.Slot>
                        </TextField.Root>
                      </Popover.Trigger>

                      <Popover.Content className="border-none! p-0! rounded-[20px]!">
                        <Calendar
                          dates={[formState.scheduledAt.value as Date]}
                          datePickerProps={{
                            dates: {
                              minDate: minimumDate,
                            },
                          }}
                          onDatesChange={(dates) =>
                            setFormState((current) => ({
                              ...current,
                              scheduledAt: {
                                ...current.scheduledAt,
                                value: dates?.[0],
                              },
                            }))
                          }
                        />
                      </Popover.Content>
                    </Popover.Root>
                  </div>
                  <div className="w-full lg:w-7/12 flex items-center gap-1">
                    <SelectField.Root
                      className="w-16"
                      value={formState.scheduledAt.hour}
                      onValueChange={(value) =>
                        setScheduleAt({ ...formState.scheduledAt, hour: value })
                      }
                    >
                      <SelectField.Trigger />
                      <SelectField.Content className="z-50 relative">
                        {hours.map((hour) => (
                          <SelectField.Item value={hour} key={hour}>
                            <span className="pr-3">{hour}</span>
                          </SelectField.Item>
                        ))}
                      </SelectField.Content>
                    </SelectField.Root>
                    <span className="font-bold">:</span>
                    <SelectField.Root
                      className="w-16"
                      value={formState.scheduledAt.minute}
                      onValueChange={(value) =>
                        setScheduleAt({
                          ...formState.scheduledAt,
                          minute: value,
                        })
                      }
                    >
                      <SelectField.Trigger />
                      <SelectField.Content className="z-50 relative">
                        {minutes.map((minute) => (
                          <SelectField.Item value={minute} key={minute}>
                            <span className="pr-3">{minute}</span>
                          </SelectField.Item>
                        ))}
                      </SelectField.Content>
                    </SelectField.Root>
                    <span className="font-bold">:</span>
                    <SelectField.Root
                      className="w-16"
                      value={formState.scheduledAt.ampm}
                      onValueChange={(value) =>
                        setScheduleAt({ ...formState.scheduledAt, ampm: value })
                      }
                    >
                      <SelectField.Trigger />
                      <SelectField.Content className="z-50 relative">
                        <SelectField.Item value={'AM'}>
                          <span className="pr-3">{'AM'}</span>
                        </SelectField.Item>
                        <SelectField.Item value={'PM'}>
                          <span className="pr-3">{'PM'}</span>
                        </SelectField.Item>
                      </SelectField.Content>
                    </SelectField.Root>
                  </div>
                </div>

                <div className="mt-4 cursor-default -ml-6">
                  <Alert.Root variant="info">
                    <Alert.Icon>
                      <InfoCircleIcon />
                    </Alert.Icon>
                    <Alert.Title className="text-left flex flex-col">
                      <span>
                        This is the time at which we will start sending out your
                        broadcast.
                      </span>
                      <span className="mt-1.5">
                        Depending on the size of your list, it may take a few minutes to a
                        few hours to send to all the contacts.
                      </span>
                    </Alert.Title>
                  </Alert.Root>
                </div>
              </RadioGroupCardItem>
            </div>

            {ServerErrorsList ? <div className="mt-4">{ServerErrorsList}</div> : null}
          </div>

          <Dialog.Footer className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <Text>
              {schedule === 'later' ? `Scheduled for ${formattedScheduledDate}` : ''}
            </Text>
            <div className="flex items-center gap-4">
              <Dialog.Close asChild>
                <Button variant="tertiary">Cancel</Button>
              </Dialog.Close>

              <ServerForm {...serverFormProps}>
                <Button type="submit" loading={isPending}>
                  {schedule === 'later'
                    ? isQueuedForSending
                      ? 'Update schedule'
                      : 'Schedule broadcast'
                    : 'Send now'}
                </Button>
              </ServerForm>
            </div>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  )
}
