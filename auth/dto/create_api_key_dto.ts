import { type InferInput, array, objectAsync, picklist, string } from 'valibot'

export const CreateApiKeySchema = objectAsync({
  capabilities: picklist(['send', 'engage', 'leads', 'letters', 'optimize']),
  domains: array(string()),
})

export type CreateApiKeyDto = InferInput<typeof CreateApiKeySchema>
