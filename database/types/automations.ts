export const automationStepSubtypesTriggerMap = {
  TRIGGER_EMPTY: 'TRIGGER_EMPTY',
  TRIGGER_CONTACT_SUBSCRIBED: 'TRIGGER_CONTACT_SUBSCRIBED',
  TRIGGER_CONTACT_UNSUBSCRIBED: 'TRIGGER_CONTACT_UNSUBSCRIBED',
  TRIGGER_CONTACT_TAG_ADDED: 'TRIGGER_CONTACT_TAG_ADDED',
  TRIGGER_CONTACT_TAG_REMOVED: 'TRIGGER_CONTACT_TAG_REMOVED',
  TRIGGER_API_MANUAL: 'TRIGGER_API_MANUAL',
} as const

export const automationStepSubtypesTrigger = [
  automationStepSubtypesTriggerMap.TRIGGER_EMPTY,
  automationStepSubtypesTriggerMap.TRIGGER_CONTACT_SUBSCRIBED,
  automationStepSubtypesTriggerMap.TRIGGER_CONTACT_UNSUBSCRIBED,
  automationStepSubtypesTriggerMap.TRIGGER_CONTACT_TAG_ADDED,
  automationStepSubtypesTriggerMap.TRIGGER_CONTACT_TAG_REMOVED,
  automationStepSubtypesTriggerMap.TRIGGER_API_MANUAL,
] as const

export type AUTOMATION_STEP_SUB_TYPES_TRIGGER =
  (typeof automationStepSubtypesTrigger)[number]

export const automationStepSubtypesAction = [
  'ACTION_EMPTY',
  'ACTION_SEND_EMAIL',
  'ACTION_ADD_TAG',
  'ACTION_REMOVE_TAG',
  'ACTION_SUBSCRIBE_TO_AUDIENCE',
  'ACTION_UNSUBSCRIBE_FROM_AUDIENCE',
  'ACTION_UPDATE_CONTACT_ATTRIBUTES',
] as const

export const automationStepSubtypesRule = [
  'RULE_IF_ELSE',
  'RULE_WAIT_FOR_DURATION',
  'RULE_PERCENTAGE_SPLIT',
  'RULE_WAIT_FOR_TRIGGER',
] as const

export const automationStepSubtypesEnd = ['END'] as const

export const automationStepTypes = ['TRIGGER', 'ACTION', 'RULE', 'END'] as const
export const automationStepSubtypes = [
  ...automationStepSubtypesTrigger,
  ...automationStepSubtypesAction,
  ...automationStepSubtypesRule,
  ...automationStepSubtypesEnd,
] as const

export type AutomationStepType = 'TRIGGERS' | 'ACTIONS' | 'RULES'
export type AutomationStepSubType =
  | (typeof automationStepSubtypesRule)[number]
  | (typeof automationStepSubtypesTrigger)[number]
  | (typeof automationStepSubtypesAction)[number]
  | 'END'
