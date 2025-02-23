import { Text } from '@kibamail/owly/text'

export function AgreeToTermsAndPolicy() {
  return (
    <div className="w-full pt-6 sm:pt-10 pb-6 sm:pb-10 lg:pb-20 px-5 lg:px-10 flex items-center flex-col">
      <Text className="kb-content-tertiary">
        By continuing, you agree to Kibamail{"'"}s
      </Text>
      <Text className="kb-content-tertiary">
        <a className="kb-content-primary underline" href="/legal/terms">
          Terms of Service
        </a>
        <span className="mx-[2px]">and</span>
        <a className="kb-content-primary underline" href="/legal/privacy">
          privacy policy
        </a>
      </Text>
    </div>
  )
}
