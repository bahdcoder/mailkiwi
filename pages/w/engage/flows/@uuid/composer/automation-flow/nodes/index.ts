import type { AutomationStepSubType } from '@/database/types/automations.js'
import { TriggerEmptyNode } from './triggers/trigger_empty_node.jsx'
import { EndNode } from './end/end_node.jsx'
import './styles.css'
import { RuleIfElseNode } from './rules/rule_if_else_node.jsx'

export const nodeTypes: Partial<Record<AutomationStepSubType, React.FC<any>>> = {
  // triggers
  TRIGGER_EMPTY: TriggerEmptyNode,

  // actions

  // rules
  RULE_IF_ELSE: RuleIfElseNode,

  // end
  END: EndNode,
}
