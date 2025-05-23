import './styles.css'
import type { AutomationStepSubType } from '#root/database/types/automations.js'
import { ActionUnsubscribeToAudienceNode } from '#root/pages/w/engage/flows/@uuid/composer/automation-flow/nodes/actions/action_unsubscribe_from_audience.jsx'
import { ActionAddTagNode } from './actions/action_add_tag_node.jsx'
import { ActionEmptyNode } from './actions/action_empty_node.jsx'
import { ActionRemoveTagNode } from './actions/action_remove_tag_node.jsx'
import { ActionSendEmailNode } from './actions/action_send_email_node.jsx'
import { ActionSubscribeToAudienceNode } from './actions/action_subscribe_to_audience.jsx'
import { ActionUpdateContactAttributesNode } from './actions/action_update_contact_attributes.jsx'
import { EndNode } from './end/end_node.jsx'
import { RuleIfElseNode } from './rules/rule_if_else_node.jsx'
import { TriggerEmptyNode } from './triggers/trigger_empty_node.jsx'
import { RuleWaitForDurationNode } from './rules/rule_wait_for_duration_node.jsx'

// biome-ignore lint/suspicious/noExplicitAny: React component props are complex and varied
export const nodeTypes: Partial<Record<AutomationStepSubType, React.FC<any>>> = {
  // triggers
  TRIGGER_EMPTY: TriggerEmptyNode,

  // actions
  ACTION_SEND_EMAIL: ActionSendEmailNode,
  ACTION_EMPTY: ActionEmptyNode,
  ACTION_REMOVE_TAG: ActionRemoveTagNode,
  ACTION_ADD_TAG: ActionAddTagNode,
  ACTION_UPDATE_CONTACT_ATTRIBUTES: ActionUpdateContactAttributesNode,
  ACTION_SUBSCRIBE_TO_AUDIENCE: ActionSubscribeToAudienceNode,
  ACTION_UNSUBSCRIBE_FROM_AUDIENCE: ActionUnsubscribeToAudienceNode,

  // rules
  RULE_IF_ELSE: RuleIfElseNode,
  RULE_WAIT_FOR_DURATION: RuleWaitForDurationNode,

  // end
  END: EndNode,
}
