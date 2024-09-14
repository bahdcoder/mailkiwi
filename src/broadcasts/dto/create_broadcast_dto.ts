import { eq } from "drizzle-orm"
import {
  type InferInput,
  checkAsync,
  nonEmpty,
  number,
  object,
  objectAsync,
  optional,
  pipe,
  pipeAsync,
  string,
} from "valibot"

import { audiences } from "@/database/schema/schema.ts"

import { makeDatabase } from "@/shared/container/index.js"

export const CreateBroadcastDto = objectAsync({
  name: pipe(string(), nonEmpty()),
  audienceId: pipeAsync(
    number(),
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
