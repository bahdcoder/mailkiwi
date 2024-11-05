import {
  type InferInput,
  integer,
  nonEmpty,
  number,
  object,
  objectAsync,
  optional,
  optionalAsync,
  picklist,
  pipe,
  string,
} from "valibot"

import { audiences } from "@/database/schema.js"

import { entityIdValidator } from "@/shared/utils/validators/entity_id_validator.js"

export const CreateProductSchema = objectAsync({
  name: pipe(string(), nonEmpty()),
  billingCycle: picklist(["monthly", "yearly", "once"]),
  price: pipe(number(), integer()),
  priceMonthly: pipe(number(), integer()),
  priceYearly: pipe(number(), integer()),
  audienceId: optionalAsync(entityIdValidator(audiences)),
})

export type CreateProductDto = InferInput<typeof CreateProductSchema>
