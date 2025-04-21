import { type InferInput, objectAsync } from 'valibot'

export const UpdateWebsiteSchema = objectAsync({})

export type UpdateWebsiteDto = InferInput<typeof UpdateWebsiteSchema>
