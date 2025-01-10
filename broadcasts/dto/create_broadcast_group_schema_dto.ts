import { type InferInput, nonEmpty, objectAsync, optional, pipe, string } from "valibot"

export const CreateBroadcastGroupSchema = objectAsync({
  name: pipe(string(), nonEmpty("Please provide a name for this broadcast group.")),
})

export type CreateBroadcastGroupDto = InferInput<typeof CreateBroadcastGroupSchema>
