import type { CommerceProviderContract } from '@/commerce/contracts/commerce_provider_contract.js'
import { PaystackCommerceProvider } from '@/commerce/providers/paystack/paystack_commerce_provider.js'
import { StripeCommerceProvider } from '@/commerce/providers/stripe/stripe_commerce_provider.js'

import { container } from '@/utils/typi.js'

export class CommerceProviderTool {
  createProvider(name: 'stripe' | 'paystack' | 'flutterwave'): CommerceProviderContract {
    switch (name) {
      case 'stripe':
        return container.make(StripeCommerceProvider)
      case 'paystack':
        return container.make(PaystackCommerceProvider)
      default:
        return container.make(StripeCommerceProvider)
    }
  }
}
