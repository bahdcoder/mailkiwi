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

export interface CommerceProviderContract {
  createAccount: (
    account: AccountInformation,
  ) => Promise<{ id: string; onboardingLink?: string }>

  createOnboardingLink: (
    accountId: string,
  ) => Promise<{ onboardingLink: string }>

  requiresExternalOnboarding: boolean
}
