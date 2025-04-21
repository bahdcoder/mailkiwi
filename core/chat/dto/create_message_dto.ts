import { type InferInput, array, object, record, string } from 'valibot'

export const CreateMessageSchema = object({
  content: record(string(), array(string())),
})

export type CreateMessageDto = InferInput<typeof CreateMessageSchema>
