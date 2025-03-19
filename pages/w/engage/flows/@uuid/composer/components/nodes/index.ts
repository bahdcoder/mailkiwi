import { SendEmailActionNode } from '@/pages/w/engage/flows/@uuid/composer/components/nodes/actions/send_email_action_node.jsx'
import { SendWebhookActionNode } from '@/pages/w/engage/flows/@uuid/composer/components/nodes/actions/send_webhook_action_node.jsx'
import { TagUntagActionNode } from '@/pages/w/engage/flows/@uuid/composer/components/nodes/actions/tag_untag_action_node.jsx'
import { UnsubscribeActionNode } from '@/pages/w/engage/flows/@uuid/composer/components/nodes/actions/unsubscribe_action_node.jsx'
import { UpdateContactActionNode } from '@/pages/w/engage/flows/@uuid/composer/components/nodes/actions/update_contact_action_node.jsx'
import { IfElseRuleNode } from '@/pages/w/engage/flows/@uuid/composer/components/nodes/rules/if_else_rule_node.jsx'
import { PercentageSplitRuleNode } from '@/pages/w/engage/flows/@uuid/composer/components/nodes/rules/percentage_split_rule_node.jsx'
import { TimeDelayRuleNode } from '@/pages/w/engage/flows/@uuid/composer/components/nodes/rules/time_delay_rule_node.jsx'
import { AutomationTriggerNode } from '@/pages/w/engage/flows/@uuid/composer/components/nodes/triggers/automation_trigger_node.jsx'
import { FlowEndTriggerNode } from '@/pages/w/engage/flows/@uuid/composer/components/nodes/triggers/flow_end_trigger_node.jsx'
import { PlaceholderTriggerNode } from '@/pages/w/engage/flows/@uuid/composer/components/nodes/triggers/placeholder_trigger_node.jsx'

export const ruleNodeTypes = {
  if_else: IfElseRuleNode,
  time_delay: TimeDelayRuleNode,
  percentage_split: PercentageSplitRuleNode,
}

export const actionNodeTypes = {
  tag_untag: TagUntagActionNode,
  send_email: SendEmailActionNode,
  unsubscribe: UnsubscribeActionNode,
  send_webhook: SendWebhookActionNode,
  update_contact: UpdateContactActionNode,
}

export const triggerNodeTypes = {
  trigger: AutomationTriggerNode,
  flow_end: FlowEndTriggerNode,
  placeholder: PlaceholderTriggerNode,
}

export const automationNodeTypes = {
  // rules
  ...ruleNodeTypes,

  // actions
  ...actionNodeTypes,

  // triggers
  ...triggerNodeTypes,
}
