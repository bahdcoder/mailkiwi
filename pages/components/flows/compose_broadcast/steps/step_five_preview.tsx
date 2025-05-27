import { BroadcastDetails } from '#root/pages/w/engage/broadcasts/@uuid/components/broadcast-details.jsx'
import { Heading } from '@kibamail/owly/heading'
import { usePageContext } from 'vike-react/usePageContext'
import type { BroadcastPageProps } from '#root/pages/types/broadcast-page-props.js'

export function StepFivePreview() {
  const { broadcast } = usePageContext().pageProps as BroadcastPageProps

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="w-full max-w-[640px] mx-auto pt-16">
        <Heading size="xs" variant="display">
          {broadcast?.emailContent?.subject ?? broadcast?.name}
        </Heading>

        <div className="mt-4">
          <BroadcastDetails />
        </div>

        <div className="mt-4">
          <div className="w-full bg-white border border-(--black-10) min-h-[896px]" />
        </div>
      </div>
    </div>
  )
}
