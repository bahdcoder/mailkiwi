import type {
  AutomationStep,
  AutomationWithSteps,
} from '@/database/database_schema_types.js'
import {
  type AutomationStepSubType,
  type AutomationStepType,
  automationStepSubtypesAction,
  automationStepSubtypesRule,
  automationStepSubtypesTrigger,
} from '@/database/types/automations.js'
import { AxesIcon } from '@/pages/components/icons/axes.svg.jsx'
import { BellOffIcon } from '@/pages/components/icons/bell-off.svg.jsx'
import { BellIcon } from '@/pages/components/icons/bell.svg.jsx'
import { LabelIcon } from '@/pages/components/icons/label.svg.jsx'
import { MailIcon } from '@/pages/components/icons/mail.svg.jsx'
import { PercentageIcon } from '@/pages/components/icons/percentage.svg.jsx'
import { PlusIcon } from '@/pages/components/icons/plus.svg.jsx'
import { TimerIcon } from '@/pages/components/icons/timer.svg.jsx'
import { UserPlusIcon } from '@/pages/components/icons/user-plus.svg.jsx'
import { UserXmarkIcon } from '@/pages/components/icons/user-xmark.svg.jsx'
import { UserIcon } from '@/pages/components/icons/user.svg.jsx'
import { WebhookIcon } from '@/pages/components/icons/webhook.svg.jsx'
import { usePageProps } from '@/pages/hooks/use_page_props.js'
import {
  ServerForm,
  useServerFormMutation,
} from '@/pages/hooks/use_server_form_mutation.jsx'
import type { EdgeElement } from '@/pages/w/engage/flows/@uuid/composer/automation-flow/types/elements.js'
import { route } from '@/shared/routes/route_aliases.js'
import { Button } from '@kibamail/owly/button'
import * as Dialog from '@kibamail/owly/dialog'
import { Spinner } from '@kibamail/owly/spinner'
import { Text } from '@kibamail/owly/text'
import classNames from 'classnames'
import React from 'react'
import { usePageContext } from 'vike-react/usePageContext'

const nodes: Record<AutomationStepType, ReadonlyArray<AutomationStepSubType>> = {
  TRIGGERS: automationStepSubtypesTrigger,
  ACTIONS: automationStepSubtypesAction,
  RULES: automationStepSubtypesRule,
}

const icons: Partial<
  Record<AutomationStepSubType, React.FC<React.SVGProps<SVGSVGElement>>>
> = {
  // actions
  ACTION_ADD_TAG: LabelIcon,
  ACTION_REMOVE_TAG: LabelIcon,
  ACTION_SEND_EMAIL: MailIcon,
  ACTION_SUBSCRIBE_TO_AUDIENCE: BellIcon,
  ACTION_UNSUBSCRIBE_FROM_AUDIENCE: BellOffIcon,
  ACTION_UPDATE_CONTACT_ATTRIBUTES: UserIcon,

  // triggers
  TRIGGER_CONTACT_SUBSCRIBED: UserPlusIcon,
  TRIGGER_CONTACT_UNSUBSCRIBED: UserXmarkIcon,
  TRIGGER_CONTACT_TAG_ADDED: LabelIcon,
  TRIGGER_CONTACT_TAG_REMOVED: LabelIcon,
  TRIGGER_EMPTY: LabelIcon,
  TRIGGER_API_MANUAL: WebhookIcon,

  // rules
  RULE_IF_ELSE: AxesIcon,
  RULE_PERCENTAGE_SPLIT: PercentageIcon,
  RULE_WAIT_FOR_DURATION: TimerIcon,
  RULE_WAIT_FOR_TRIGGER: TimerIcon,
}

export interface AddNodeDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  allowedTypes: AutomationStepType[]
  edge: EdgeElement | null
  onAddNodeSuccess: (automation: AutomationWithSteps) => void
}

const NODE_TYPES_ALLOWED_TO_ADD: AutomationStepType[] = ['ACTIONS', 'RULES']

export function AddNodeDialog({
  open,
  setOpen,
  edge,
  onAddNodeSuccess,
}: AddNodeDialogProps) {
  const ctx = usePageContext()
  const [selectedSubType, setSelectedSubType] =
    React.useState<AutomationStepSubType | null>()
  const { automation } = usePageProps<{ automation: AutomationWithSteps }>()

  const { serverFormProps, ServerErrorsList, isPending, reset } = useServerFormMutation<{
    automation: AutomationWithSteps
    step: AutomationStep
  }>({
    action: route('add_automation_step', {
      audienceId: ctx.audience?.id,
      automationId: automation?.id,
    }),
    onSuccess(response) {
      setOpen(false)
      onAddNodeSuccess(response.payload.automation)
    },
    transform(form) {
      form.subtype = selectedSubType as string
      form.type = selectedSubType?.split('_')[0] as string
      form.parentId = edge?.source || ''
      form.targetId = edge?.target || ''
      return form
    },
  })

  React.useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Content className="max-w-2xl">
        <Dialog.Header>
          <Dialog.Title>Add to flow</Dialog.Title>
          <Dialog.Description>
            Select the type of node you want to add to the flow.
          </Dialog.Description>
        </Dialog.Header>

        <ServerForm {...serverFormProps}>
          <div className="p-5 grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-4">
              {Object.keys(nodes)
                .filter((node) =>
                  NODE_TYPES_ALLOWED_TO_ADD.includes(
                    node as 'TRIGGERS' | 'ACTIONS' | 'RULES',
                  ),
                )
                .map((node) => (
                  <div className="flex flex-col gap-2" key={node}>
                    <h3>
                      <Text className="capitalize font-medium">{node.toLowerCase()}</Text>
                    </h3>

                    <div className="grid grid-cols-2 gap-2">
                      {nodes[node as keyof typeof nodes].map((subtype) => {
                        const Icon = icons[subtype] ? icons[subtype] : null
                        return (
                          <button
                            type="button"
                            key={subtype}
                            onClick={() => setSelectedSubType(subtype)}
                            disabled={isPending}
                            className={classNames(
                              'flex group font-medium items-center rounded-xl justify-between border kb-border-secondary p-3',
                              {
                                'var(--background-pressed)':
                                  isPending && selectedSubType === subtype,
                                'hover:bg-[var(--background-hover)] active:bg-[var(--background-pressed)]':
                                  selectedSubType !== subtype && !isPending,
                              },
                            )}
                          >
                            <div className="flex gap-2 items-center">
                              {Icon ? <Icon className="w-5 h-5" /> : null}
                              <Text className="lowercase first-letter:uppercase">
                                {getSubtypeLabel(subtype)}
                              </Text>
                            </div>

                            {isPending && selectedSubType === subtype ? (
                              <Spinner />
                            ) : (
                              <PlusIcon className="opacity-0 transition-opacity group-hover:opacity-100 w-5 h-5" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </ServerForm>
        {ServerErrorsList ? (
          <div className="w-full px-5 pb-5">{ServerErrorsList}</div>
        ) : null}
        <Dialog.Footer className="flex justify-end gap-2">
          <Dialog.Close asChild>
            <Button variant="tertiary">Cancel</Button>
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}

function getSubtypeLabel(subtype: string): string {
  return subtype.split('_').slice(1).join(' ')
}
