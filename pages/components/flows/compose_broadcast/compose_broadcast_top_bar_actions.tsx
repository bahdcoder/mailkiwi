import { ComposeBroadcastSteps } from "./compose_broadcast_types.js"
import { useComposeBroadcastContext } from "@/pages/components/flows/compose_broadcast/state/compose_broadcast_context.jsx"
import { formatScheduleDateTime } from "@/pages/components/flows/compose_broadcast/utils/format_schedule_date.js"
import { ArrowRightIcon } from "@/pages/components/icons/arrow-right.svg.jsx"
import { InfoCircleIcon } from "@/pages/components/icons/info-circle.svg.jsx"
import { RadioGroupCardItem } from "@/pages/components/radio-group/radio-group-card-item.jsx"
import {
  ServerForm,
  useServerFormMutation,
} from "@/pages/components/server-form-mutation/hooks/use-server-form-mutation.jsx"
import { navigate } from "@/pages/utils/navigate.js"
import * as Alert from "@kibamail/owly/alert"
import { Button } from "@kibamail/owly/button"
import * as Dialog from "@kibamail/owly/dialog"
import * as SelectField from "@kibamail/owly/select-field"
import { Text } from "@kibamail/owly/text"
import * as TextField from "@kibamail/owly/text-field"
import * as RadioGroup from "@radix-ui/react-radio-group"
import { useMutation } from "@tanstack/react-query"
import React from "react"
import { toast } from "sonner"
import { usePageContext } from "vike-react/usePageContext"

import { route } from "@/shared/routes/route_aliases.js"

export function ComposeBroadcastTopBarActions() {
  const { step, syncContentToServerMutation, setStep } = useComposeBroadcastContext(
    "ComposeBroadcastTopBarActions",
  )

  switch (step) {
    case ComposeBroadcastSteps.COMPOSE:
      return <ComposeStepActions />
    case ComposeBroadcastSteps.CONTACTS:
      return <ContactsStepActions />
    case ComposeBroadcastSteps.CONFIGURE:
      return <ConfigureStepActions />
    case ComposeBroadcastSteps.PREVIEW:
      return <PreviewStepActions />
    default:
      return null
  }
}

export function ComposeStepActions() {
  const { step, syncContentToServerMutation, setStep } =
    useComposeBroadcastContext("ComposeStepActions")

  return (
    <div className="flex items-center gap-4">
      <Button disabled={syncContentToServerMutation.isPending} variant="secondary">
        Preview
      </Button>
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
    useComposeBroadcastContext("ContactsStepActions")

  async function onNextClicked() {
    await syncContentToServerMutation.mutateAsync({
      segmentId: formState.segmentId === "all" ? null : formState.segmentId,
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
    useComposeBroadcastContext("ContactsStepActions")

  async function onNextClicked() {
    await syncContentToServerMutation.mutateAsync({
      emailContent: {
        subject: formState.subject,
        previewText: formState.previewText,
      },
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
  const ctx = usePageContext()
  const today = React.useMemo(() => {
    function getTodayFormatted(): string {
      const today = new Date()

      const month = String(today.getMonth() + 1).padStart(2, "0")
      const day = String(today.getDate()).padStart(2, "0")

      return `${today.getFullYear()}-${month}-${day}`
    }

    return getTodayFormatted()
  }, [])

  const [scheduleAt, setScheduleAt] = React.useState({
    minute: "00",
    hour: "09",
    ampm: "AM",
    value: today,
  })
  const [schedule, setSchedule] = React.useState<"now" | "later">("later")

  const minutes = React.useMemo(() => {
    const minutes = ["00", "15", "30", "45"]

    return minutes
  }, [])

  const { format: formattedScheduleDate, date: scheduledDate } = React.useMemo(() => {
    return schedule === "later"
      ? formatScheduleDateTime(scheduleAt)
      : { format: "", date: new Date() }
  }, [schedule, scheduleAt])

  const hours = React.useMemo(() => {
    const hours = []
    for (let i = 1; i <= 12; i++) {
      const hour = i.toString().padStart(2, "0")
      hours.push(hour)
    }
    return hours
  }, [])

  const { getBroadcastRecipientsCount } = useComposeBroadcastContext("PreviewStepActions")

  const { serverFormProps, isPending, ServerErrorsList } = useServerFormMutation({
    action: route("send_broadcast", { uuid: ctx.routeParams.uuid }),
    onSuccess() {
      toast.success(`Broadcast has been scheduled for publish.`)

      navigate(route("broadcasts"))
    },
    transform() {
      return {
        sendAt: scheduledDate.toISOString(),
      }
    },
  })

  return (
    <div className="flex items-center gap-4">
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <Button>
            Schedule <ArrowRightIcon />
          </Button>
        </Dialog.Trigger>

        <Dialog.Content>
          <Dialog.Header className="items-center border-b-transparent">
            <Dialog.Title>Schedule publish time</Dialog.Title>
            <Dialog.Description>
              Pick a time to publish your broadcast.
            </Dialog.Description>
          </Dialog.Header>

          <ServerForm {...serverFormProps}>
            <div className="px-6 py-4 pb-6">
              <div className="grid grid-cols-1 gap-4 ">
                <RadioGroupCardItem
                  value="now"
                  disabled
                  title="Send now"
                  description={`Immediately send this broadcasts to ${getBroadcastRecipientsCount?.data?.total} contacts`}
                  onClick={() => setSchedule("now")}
                  checked={schedule === "now"}
                ></RadioGroupCardItem>
                <RadioGroupCardItem
                  value="schedule"
                  checked={schedule === "later"}
                  title="Schedule for later"
                  description={`Send this broadcast to ${getBroadcastRecipientsCount?.data?.total} contacts at a later date.`}
                  onClick={() => setSchedule("later")}
                >
                  <div className="w-full flex flex-col lg:flex-row lg:items-center mt-2 gap-4 cursor-default">
                    <div className="w-full lg:w-5/12">
                      <TextField.Root
                        type="date"
                        min={today}
                        value={scheduleAt.value}
                        onChange={(event) =>
                          setScheduleAt((current) => ({
                            ...current,
                            value: event.target.value,
                          }))
                        }
                        className="w-full"
                      ></TextField.Root>
                    </div>
                    <div className="w-full lg:w-7/12 flex items-center gap-1">
                      <SelectField.Root
                        className="w-16"
                        value={scheduleAt.hour}
                        onValueChange={(value) =>
                          setScheduleAt((current) => ({ ...current, hour: value }))
                        }
                      >
                        <SelectField.Trigger />
                        <SelectField.Content className="z-[50] relative">
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
                        value={scheduleAt.minute}
                        onValueChange={(value) =>
                          setScheduleAt((current) => ({ ...current, minute: value }))
                        }
                      >
                        <SelectField.Trigger />
                        <SelectField.Content className="z-[50] relative">
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
                        value={scheduleAt.ampm}
                        onValueChange={(value) =>
                          setScheduleAt((current) => ({ ...current, ampm: value }))
                        }
                      >
                        <SelectField.Trigger />
                        <SelectField.Content className="z-[50] relative">
                          <SelectField.Item value={"AM"}>
                            <span className="pr-3">{"AM"}</span>
                          </SelectField.Item>
                          <SelectField.Item value={"PM"}>
                            <span className="pr-3">{"PM"}</span>
                          </SelectField.Item>
                        </SelectField.Content>
                      </SelectField.Root>
                    </div>
                  </div>

                  <div className="mt-4 cursor-default">
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
                          Depending on the size of your list, it may take a few minutes to
                          a few hours to send to all the contacts.
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
                {schedule === "later" ? `Scheduled for ${formattedScheduleDate}` : ""}
              </Text>
              <div className="flex items-center gap-4">
                <Dialog.Close asChild>
                  <Button variant="tertiary">Cancel</Button>
                </Dialog.Close>
                <Button type="submit" loading={isPending}>
                  {schedule === "later" ? "Schedule broadcast" : "Send now"}
                </Button>
              </div>
            </Dialog.Footer>
          </ServerForm>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  )
}
