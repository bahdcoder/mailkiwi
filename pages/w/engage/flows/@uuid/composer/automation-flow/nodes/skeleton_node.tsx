import type { AutomationStep } from '#root/database/database_schema_types.js'
import type { AutomationStepSubType } from '#root/database/types/automations.js'
import { LabelIcon } from '#root/pages/components/icons/label.svg.jsx'
import { MailIcon } from '#root/pages/components/icons/mail.svg.jsx'
import { NetworkReverseIcon } from '#root/pages/components/icons/network-reverse.svg.jsx'
import { TimerIcon } from '#root/pages/components/icons/timer.svg.jsx'
import { Badge } from '@kibamail/owly/badge'
import { Text } from '@kibamail/owly/text'
import { Label } from '@radix-ui/react-dropdown-menu'
import type { PropsWithChildren } from 'react'
import { icons } from '../components/add-node-dialog.jsx'

export interface SkeletonNodeProps {
  step: AutomationStep
}

export const nodeLabels: Partial<Record<AutomationStepSubType, string>> = {
  // actions
  ACTION_ADD_TAG: 'Add tags',
  ACTION_REMOVE_TAG: 'Remove tags',
  ACTION_SEND_EMAIL: 'Send an email',
  ACTION_SUBSCRIBE_TO_AUDIENCE: 'Subscribe to audience',
  ACTION_UNSUBSCRIBE_FROM_AUDIENCE: 'Unsubscribe from audience',
  ACTION_UPDATE_CONTACT_ATTRIBUTES: 'Update contact attributes',

  // rules
  RULE_PERCENTAGE_SPLIT: 'Split path',
  RULE_IF_ELSE: 'If / else conditions',
  RULE_WAIT_FOR_DURATION: 'Wait for duration',
  RULE_WAIT_FOR_TRIGGER: 'Wait for trigger',

  // triggers
  TRIGGER_CONTACT_SUBSCRIBED: 'Contact subscribed',
  TRIGGER_CONTACT_UNSUBSCRIBED: 'Contact unsubscribed',
  TRIGGER_CONTACT_TAG_ADDED: 'Contact tag added',
  TRIGGER_CONTACT_TAG_REMOVED: 'Contact tag removed',
  TRIGGER_EMPTY: 'Empty trigger',
  TRIGGER_API_MANUAL: 'API manual trigger',
}

export function SkeletonNode({ step, children }: PropsWithChildren<SkeletonNodeProps>) {
  const Icon = icons[step.subtype]
  return (
    <div className="w-full h-full flex flex-col">
      <div className=" border-b pb-2 box-border border-black/5 w-full items-center flex justify-between">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="w-4! h-4! font-medium kb-content-tertiary" /> : null}

          <Text className="shrink-0 text-sm">{nodeLabels[step.subtype]}</Text>
        </div>

        <Badge
          variant="neutral"
          className="bg-white border-black/10 capitalize"
          size="sm"
        >
          {step.type.toLowerCase()}
        </Badge>
      </div>
      <div className="grow flex items-center py-2 box-border">{children}</div>
    </div>
  )
}
