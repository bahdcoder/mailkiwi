import { eq } from "drizzle-orm"
import {
  type InferInput,
  checkAsync,
  nonEmpty,
  objectAsync,
  pipe,
  pipeAsync,
  string,
} from "valibot"

import { audiences } from "@/database/schema/schema.js"

import { makeDatabase } from "@/shared/container/index.js"

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
