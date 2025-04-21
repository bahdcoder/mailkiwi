import { type InferInput, object, string } from 'valibot'

export const CreateAutomationSchema = object({
  name: string(),
})

export type CreateAutomationDto = InferInput<typeof CreateAutomationSchema>
