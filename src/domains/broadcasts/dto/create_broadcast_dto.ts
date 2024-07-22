import {
  object,
  string,
  optional,
  objectAsync,
  pipeAsync,
  checkAsync,
  InferInput,
  pipe,
  nonEmpty,
} from "valibot"
import { makeDatabase } from "@/infrastructure/container.ts"
import { eq } from "drizzle-orm"
import { audiences } from "@/infrastructure/database/schema/schema.ts"

export const CreateBroadcastDto = objectAsync({
  name: pipe(string(), nonEmpty()),
  audienceId: pipeAsync(
    string(),
    checkAsync(async (value) => {
      const database = makeDatabase()

      const audience = await database.query.audiences.findFirst({
        where: eq(audiences.id, value),
      })

      return audience !== undefined
    }),
  ),
})

export type CreateBroadcastDto = InferInput<typeof CreateBroadcastDto>
