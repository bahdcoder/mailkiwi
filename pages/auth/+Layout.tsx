import { AgreeToTermsAndPolicy } from '#root/pages/components/auth/agree-to-terms-and-policy.jsx'
import { CheckCircleSolidIcon } from '#root/pages/components/icons/check-circle-solid.svg.jsx'
import { Text } from '@kibamail/owly/text'
import type React from 'react'
import { usePageContext } from 'vike-react/usePageContext'

type AuthLayoutProps = { children?: React.ReactNode }

const PASSWORD_RESET_PATHS = '/passwords'

const WELCOME_PATHS = 'register/profile'

function PasswordResetsFlowLayout({
  children,
}: React.PropsWithChildren<AuthLayoutProps>) {
  return (
    <div className="h-screen w-full flex flex-col overflow-y-hidden">
      <div className="w-full py-8 px-4 md:px-10">
        <img src="/logos/full-light.svg" className="h-8" alt="Kibamail Logo" />
      </div>

      <div className="grow">{children}</div>

      <AgreeToTermsAndPolicy />
    </div>
  )
}

function AuthLayout({ children }: React.PropsWithChildren<AuthLayoutProps>) {
  const { urlOriginal } = usePageContext()

  const isPasswordResetsFlow = urlOriginal.includes(PASSWORD_RESET_PATHS)

  if (isPasswordResetsFlow) {
    return <PasswordResetsFlowLayout>{children}</PasswordResetsFlowLayout>
  }

  return (
    <div className="h-screen w-full overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-0">
      <div className="flex flex-col kb-bg-secondary h-full w-full">
        <div className="w-full py-8 px-4 md:px-10">
          <a href="/">
            <img src="/logos/full-light.svg" className="h-8" alt="Kibamail Logo" />
          </a>
        </div>
        <div className="grow px-5 lg:px-0">{children}</div>

        <AgreeToTermsAndPolicy />
      </div>

      <div className="hidden lg:flex flex-col h-full w-full kb-background-brand-hover pt-48 relative">
        <div className="h-12 w-full pl-24 flex flex-col max-w-lg">
          <ProductFeatureGrid />
        </div>

        <div className="absolute h-px border-t border-white border-opacity-10 bottom-48 w-full" />
        <div className="w-full absolute h-10 bottom-36 bg-black bg-opacity-5 border-t border-b border-white border-opacity-10" />
      </div>
    </div>
  )
}

function ProductFeatureGrid() {
  return (
    <div className="grid grid-cols-1 gap-8">
      <ProductFeature
        title="No subscriptions, 6,573 free emails per month"
        description="No subscriptions plans, no payment contracts, and your free email sends reset every
      month, forever."
      />
      <ProductFeature
        title="Unlimited tracking, contacts and automations."
        description="No limits on usage. Only pay for the successful emails you send via Kibamail."
      />
      <ProductFeature
        title="Open source, transparent and community driven"
        description="Audit our code and business yourself. No secrets, no tricks, no hidden fees."
      />
    </div>
  )
}

interface ProductFeatureProps {
  title?: string
  description?: string
}

function ProductFeature({ title, description }: ProductFeatureProps) {
  return (
    <div className="flex items-start gap-x-2">
      <CheckCircleSolidIcon className="kb-content-notice shrink-0" />

      <div className="flex flex-col grow gap-y-2">
        <Text className="kb-content-primary-inverse" size="lg">
          {title}
        </Text>

        <Text className="kb-content-tertiary-inverse">{description}</Text>
      </div>
    </div>
  )
}

export { AuthLayout as Layout }
