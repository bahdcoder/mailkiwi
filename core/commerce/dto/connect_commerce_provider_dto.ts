import { banks } from '#root/core/commerce/providers/paystack/helpers/get_banks.js'
import {
  type InferInput,
  maxLength,
  minLength,
  nonEmpty,
  object,
  optional,
  picklist,
  pipe,
  regex,
  string,
} from 'valibot'

export const ConnectCommerceProviderSchema = object({
  provider: pipe(picklist(['stripe', 'paystack', 'flutterwave']), nonEmpty()),
  country: optional(string()),
  payoutInformation: optional(
    object({
      bankCode: picklist(banks.map((bank) => bank.code)),
      accountNumber: pipe(
        string(),
        nonEmpty(),
        regex(/^\d+$/),
        minLength(10),
        maxLength(10),
      ),
    }),
  ),
})

export type ConnectCommerceProviderDto = InferInput<typeof ConnectCommerceProviderSchema>
