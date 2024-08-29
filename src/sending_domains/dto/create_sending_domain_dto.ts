import { eq } from "drizzle-orm"
import {
  type InferInput,
  checkAsync,
  objectAsync,
  pipeAsync,
  regex,
  string,
} from "valibot"

import { sendingDomains } from "@/database/schema/schema.ts"

import { makeDatabase } from "@/shared/container/index.ts"

export const CreateSendingDomainSchema = objectAsync({
  name: pipeAsync(
    string(),
    regex(/^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/),
    checkAsync(async (name) => {
      const database = makeDatabase()

      const sendingDomainExists =
        await database.query.sendingDomains.findFirst({
          where: eq(sendingDomains.name, name),
        })

      return sendingDomainExists === undefined
    }, "This sending domain is already registered."),
  ),
})

export type CreateSendingDomainDto = InferInput<
  typeof CreateSendingDomainSchema
>
