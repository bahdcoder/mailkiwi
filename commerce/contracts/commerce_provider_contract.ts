import type { Product } from '@/database/database_schema_types.js'

export interface PayoutInformation {
  bankCode: string
  accountNumber: string
}

export interface AccountInformation {
  email: string
  name?: string
  country?: string
  teamId: string
  payoutInformation?: PayoutInformation
}

export interface InitializeOneTimePaymentPayload {
  accountId: string
  email: string
  product: Product
}

export interface ConfirmOneTimePaymentPayload {
  product: Product
  reference: string
}

export interface CommerceProviderContract {
  createAccount: (
    account: AccountInformation,
  ) => Promise<{ id: string; onboardingLink?: string }>

  createOnboardingLink: (accountId: string) => Promise<{ onboardingLink: string }>

  initialiseOneTimePayment: (
    payload: InitializeOneTimePaymentPayload,
  ) => Promise<{ paymentUrl: string }>

  confirmOneTimePayment: (
    payload: ConfirmOneTimePaymentPayload,
  ) => Promise<{ success: boolean }>

  requiresExternalOnboarding: boolean
}
