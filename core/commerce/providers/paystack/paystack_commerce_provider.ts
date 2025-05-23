import { appEnv } from '#root/core/app/env/app_env.js'
import type {
  AccountInformation,
  CommerceProviderContract,
  ConfirmOneTimePaymentPayload,
  InitializeOneTimePaymentPayload,
} from '#root/core/commerce/contracts/commerce_provider_contract.js'
import { DateTime } from 'luxon'

import { TeamRepository } from '#root/core/teams/repositories/team_repository.js'

import { makeHttpClient } from '#root/core/shared/http/http_client.js'
import { commercePath, rootPath } from '#root/core/shared/utils/routes/root_path.js'

import { container } from '#root/core/utils/typi.js'

export class PaystackCommerceProvider implements CommerceProviderContract {
  requiresExternalOnboarding = false

  constructor(
    protected httpClient = makeHttpClient()
      .baseURL('https://api.paystack.co')
      .headers({
        Authorization: `Bearer ${appEnv.COMMERCE_PROVIDER_PAYSTACK_SECRET_KEY}`,
      }),
  ) {}

  async createAccount(account: AccountInformation) {
    const { data, error } = await this.httpClient
      .url('/subaccount')
      .payload({
        business_name: account?.name,
        bank_code: account?.payoutInformation?.bankCode,
        account_number: account?.payoutInformation?.accountNumber,
        percentage_charge: 0,
      })
      .asJson()
      .post()
      .send<{ data: { subaccount_code: string; active: boolean } }>()

    if (error) throw error

    await container.make(TeamRepository).teams().update(account.teamId, {
      commerceProvider: 'paystack',
      commerceProviderAccountId: data?.data?.subaccount_code,
      commerceProviderConfirmedAt: DateTime.now().toJSDate(),
    })

    return { id: data?.data?.subaccount_code }
  }

  async createOnboardingLink(accountId: string) {
    return { onboardingLink: '' }
  }

  async initialiseOneTimePayment({
    accountId,
    product,
    email,
  }: InitializeOneTimePaymentPayload) {
    const { data } = await this.httpClient
      .url('/transaction/initialize')
      .payload({
        email,
        amount: product.price,
        subaccount: accountId,
        bearer: 'subaccount',
        metadata: JSON.stringify({
          productId: product.id,
        }),
        transaction_charge: 0,
        callback_url: commercePath(`products/${product.id}/payments/callback`),
      })
      .asJson()
      .post()
      .send<{
        data: {
          authorization_url: string
          reference: string
          access_code: string
        }
        status: boolean
        message: string
      }>()

    return { paymentUrl: data.data?.authorization_url }
  }

  async confirmOneTimePayment({ reference }: ConfirmOneTimePaymentPayload) {
    const { data, error } = await this.httpClient
      .url(`/transaction/verify/${reference}`)
      .payload({})
      .asJson()
      .get()
      .send<{
        data: {
          status: string
          amount: number
        }
        status: boolean
        message: string
      }>()

    return { success: data?.data?.status === 'success' }
  }
}
