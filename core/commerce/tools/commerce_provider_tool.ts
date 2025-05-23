import type { CommerceProviderContract } from '#root/core/commerce/contracts/commerce_provider_contract.js'
import { PaystackCommerceProvider } from '#root/core/commerce/providers/paystack/paystack_commerce_provider.js'
import { StripeCommerceProvider } from '#root/core/commerce/providers/stripe/stripe_commerce_provider.js'

import { container } from '#root/core/utils/typi.js'

/**
 * CommerceProviderTool is a factory for creating payment provider implementations.
 *
 * This tool implements the Factory pattern to create the appropriate payment provider
 * implementation based on the requested provider name. It abstracts away the details
 * of provider instantiation, allowing the rest of the application to work with
 * payment providers through the unified CommerceProviderContract interface.
 *
 * The tool supports multiple payment providers:
 * - Stripe: A global payment processor with extensive features
 * - Paystack: A payment processor focused on African markets
 * - Flutterwave: Another payment processor focused on African markets
 *
 * This approach makes it easy to add new payment providers in the future by simply
 * adding a new case to the switch statement and implementing the corresponding provider class.
 */
export class CommerceProviderTool {
  /**
   * Creates a payment provider implementation based on the specified name.
   *
   * This factory method instantiates the appropriate provider implementation
   * based on the requested provider name. It uses the dependency injection
   * container to create the provider instances, ensuring proper initialization
   * and dependency management.
   *
   * If an unsupported provider name is specified, it falls back to Stripe
   * as the default provider.
   *
   * @param name - The name of the payment provider to create
   * @returns An implementation of the CommerceProviderContract for the specified provider
   */
  createProvider(name: 'stripe' | 'paystack' | 'flutterwave'): CommerceProviderContract {
    switch (name) {
      case 'stripe':
        return container.make(StripeCommerceProvider)
      case 'paystack':
        return container.make(PaystackCommerceProvider)
      default:
        // Fall back to Stripe as the default provider
        return container.make(StripeCommerceProvider)
    }
  }
}
