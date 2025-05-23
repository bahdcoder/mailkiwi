import {
  type InferInput,
  checkAsync,
  integer,
  nonEmpty,
  number,
  object,
  objectAsync,
  optional,
  optionalAsync,
  picklist,
  pipe,
  pipeAsync,
  string,
} from 'valibot'

import { audiences } from '#root/database/schema.js'

import { entityIdValidator } from '#root/core/shared/utils/validators/entity_id_validator.js'

export const CreateProductSchema = pipeAsync(
  objectAsync({
    name: pipe(string(), nonEmpty()),
    billingCycle: picklist(['monthly', 'yearly', 'once']),
    price: optional(pipe(number(), integer())),
    priceMonthly: optional(pipe(number(), integer())),
    priceYearly: optional(pipe(number(), integer())),
  }),
  checkAsync(async (input) => {
    if (!input.price && !input.priceMonthly && !input.priceYearly) {
      return false
    }

    return true
  }, 'At least one of the following fields must be provided: "price", "priceMonthly", "priceYearly"'),
  checkAsync(async (input) => {
    if ((input.priceYearly || input.priceMonthly) && input.price) {
      return false
    }

    return true
  }, 'You can only provide either "price" or "priceMonthly" and "priceYearly"'),
  checkAsync(async (input) => {
    if (input.billingCycle === 'monthly' && !input.priceMonthly) {
      return false
    }

    return true
  }, 'You must provide "priceMonthly" when "billingCycle" is "monthly"'),
  checkAsync(async (input) => {
    if (input.billingCycle === 'yearly' && !input.priceYearly) {
      return false
    }

    return true
  }, 'You must provide "priceYearly" when "billingCycle" is "yearly"'),
  checkAsync(async (input) => {
    if (input.billingCycle === 'once' && !input.price) {
      return false
    }

    return true
  }, 'You must provide "price" when "billingCycle" is "once"'),
)

export type CreateProductDto = InferInput<typeof CreateProductSchema>
