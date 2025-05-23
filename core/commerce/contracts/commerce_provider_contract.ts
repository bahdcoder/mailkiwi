import type { Product } from '#root/database/database_schema_types.js'

/**
 * PayoutInformation defines the banking details for receiving payments.
 *
 * This interface captures the necessary banking information to set up
 * payment disbursements to merchants (teams). The specific fields may
 * vary by payment provider and region, but typically include:
 *
 * - bankCode: A standardized code identifying the financial institution
 * - accountNumber: The merchant's account number at the specified bank
 *
 * This information is used during the commerce provider onboarding process
 * to configure automatic payouts to the team's bank account.
 */
export interface PayoutInformation {
  bankCode: string
  accountNumber: string
}

/**
 * AccountInformation defines the merchant account details for payment providers.
 *
 * This interface captures the necessary information to create a merchant account
 * with a payment provider. It includes:
 *
 * - email: The primary contact email for the merchant account
 * - name: The business name to display on checkout pages and receipts
 * - country: The merchant's country of operation (affects available payment methods)
 * - teamId: The internal team ID to associate with this merchant account
 * - payoutInformation: Banking details for receiving payments
 *
 * Different payment providers may require different subsets of this information,
 * with some fields being optional depending on the provider's requirements.
 */
export interface AccountInformation {
  email: string
  name?: string
  country?: string
  teamId: string
  payoutInformation?: PayoutInformation
}

/**
 * InitializeOneTimePaymentPayload defines the data needed to start a payment process.
 *
 * This interface captures the necessary information to initialize a one-time payment
 * with a payment provider. It includes:
 *
 * - accountId: The merchant account ID with the payment provider
 * - email: The customer's email address for receipts and communication
 * - product: The product being purchased, including price and details
 *
 * This information is used to create a payment session or checkout page
 * that the customer can use to complete their purchase.
 */
export interface InitializeOneTimePaymentPayload {
  accountId: string
  email: string
  product: Product
}

/**
 * ConfirmOneTimePaymentPayload defines the data needed to verify a completed payment.
 *
 * This interface captures the necessary information to confirm that a payment
 * has been successfully processed. It includes:
 *
 * - product: The product that was purchased
 * - reference: A unique identifier for the payment transaction
 *
 * This information is used to verify the payment status with the payment provider
 * and update the system accordingly (e.g., granting access to purchased content).
 */
export interface ConfirmOneTimePaymentPayload {
  product: Product
  reference: string
}

/**
 * CommerceProviderContract defines the interface for payment provider integrations.
 *
 * This contract establishes a consistent API for interacting with different payment
 * providers (Stripe, Paystack, etc.) throughout the application. It abstracts away
 * the provider-specific implementation details, allowing the rest of the system to
 * work with any supported payment provider through a unified interface.
 *
 * The contract includes methods for:
 * 1. Creating and configuring merchant accounts
 * 2. Managing the onboarding process for merchants
 * 3. Processing one-time payments for products
 * 4. Verifying payment completion
 *
 * Each payment provider implements this contract according to its specific API
 * requirements, while maintaining consistent behavior from the application's perspective.
 */
export interface CommerceProviderContract {
  /**
   * Creates a merchant account with the payment provider.
   *
   * @param account - The merchant account information
   * @returns The provider-specific account ID and optional onboarding link
   */
  createAccount: (
    account: AccountInformation,
  ) => Promise<{ id: string; onboardingLink?: string }>

  /**
   * Generates a link for completing the merchant onboarding process.
   *
   * Some providers (like Stripe) require merchants to complete additional
   * steps on the provider's website to verify their identity and set up
   * their account. This method generates a link to that process.
   *
   * @param accountId - The provider-specific merchant account ID
   * @returns An object containing the onboarding URL
   */
  createOnboardingLink: (accountId: string) => Promise<{ onboardingLink: string }>

  /**
   * Initializes a one-time payment process for a product.
   *
   * This method creates a payment session or checkout page that the customer
   * can use to complete their purchase. The specific implementation depends
   * on the payment provider's checkout flow.
   *
   * @param payload - The payment initialization data
   * @returns An object containing the payment/checkout URL
   */
  initialiseOneTimePayment: (
    payload: InitializeOneTimePaymentPayload,
  ) => Promise<{ paymentUrl: string }>

  /**
   * Confirms that a payment has been successfully processed.
   *
   * This method verifies the payment status with the payment provider
   * and returns whether the payment was successful. It's typically called
   * after the customer completes the checkout process.
   *
   * @param payload - The payment confirmation data
   * @returns An object indicating whether the payment was successful
   */
  confirmOneTimePayment: (
    payload: ConfirmOneTimePaymentPayload,
  ) => Promise<{ success: boolean }>

  /**
   * Indicates whether the provider requires external onboarding.
   *
   * Some providers (like Stripe) require merchants to complete an onboarding
   * process on the provider's website, while others (like Paystack) can be
   * fully configured through the API without external steps.
   */
  requiresExternalOnboarding: boolean
}
