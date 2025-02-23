import { BroadcastDetails } from '@/pages/w/engage/broadcasts/@uuid/components/broadcast-details.jsx'
import type { EngageBroadcastsComposerPageProps } from '@/pages/w/engage/broadcasts/@uuid/composer/+Page.jsx'
import { Heading } from '@kibamail/owly/heading'
import { usePageContext } from 'vike-react/usePageContext'

export function StepFivePreview() {
  const ctx = usePageContext()
  const pageProps = ctx.pageProps as EngageBroadcastsComposerPageProps

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="w-full max-w-[640px] mx-auto pt-16">
        <Heading size="xs" variant="display">
          {pageProps?.broadcast?.emailContent?.subject ?? pageProps?.broadcast?.name}
        </Heading>

        <div className="mt-4">
          <BroadcastDetails />
        </div>

        <div className="mt-4">
          <div className="w-full bg-white border border-[var(--black-10)] min-h-[896px]"></div>
        </div>
      </div>
    </div>
  )
}
