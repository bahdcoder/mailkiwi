import type { AutomationStepSubType } from '@/database/types/automations.js'
import { TriggerEmptyNode } from './triggers/trigger_empty_node.jsx'
import { EndNode } from './end/end_node.jsx'
import './styles.css'
import { RuleIfElseNode } from './rules/rule_if_else_node.jsx'
import { ActionSendEmailNode } from '@/pages/w/engage/flows/@uuid/composer/automation-flow/nodes/actions/action_send_email_node.jsx'
import { ActionEmptyNode } from '@/pages/w/engage/flows/@uuid/composer/automation-flow/nodes/actions/action_empty_node.jsx'
import { ActionRemoveTagNode } from '@/pages/w/engage/flows/@uuid/composer/automation-flow/nodes/actions/action_remove_tag_node.jsx'
import { ActionAddTagNode } from '@/pages/w/engage/flows/@uuid/composer/automation-flow/nodes/actions/action_add_tag_node.jsx'
import { ActionUpdateContactAttributesNode } from '@/pages/w/engage/flows/@uuid/composer/automation-flow/nodes/actions/action_update_contact_attributes.jsx'

export const nodeTypes: Partial<Record<AutomationStepSubType, React.FC<any>>> = {
  // triggers
  TRIGGER_EMPTY: TriggerEmptyNode,

  // actions
  ACTION_SEND_EMAIL: ActionSendEmailNode,
  ACTION_EMPTY: ActionEmptyNode,
  ACTION_REMOVE_TAG: ActionRemoveTagNode,
  ACTION_ADD_TAG: ActionAddTagNode,
  ACTION_UPDATE_CONTACT_ATTRIBUTES: ActionUpdateContactAttributesNode,

  // rules
  RULE_IF_ELSE: RuleIfElseNode,

  // end
  END: EndNode,
}
