import { type InferInput, objectAsync } from 'valibot'

export const UpdateWebsiteSchema = objectAsync({})

type UpdateWebsiteDto = InferInput<typeof UpdateWebsiteSchema>
