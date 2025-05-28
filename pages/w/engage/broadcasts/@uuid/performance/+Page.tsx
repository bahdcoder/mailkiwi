import { Button } from '#root/pages/components/button/button.jsx'
import { MetricCard } from '#root/pages/components/performance/metric-card.jsx'
import { Heading } from '@kibamail/owly/heading'
import * as Tabs from '@kibamail/owly/tabs'
import { Text } from '@kibamail/owly/text'
import { usePageContext } from 'vike-react/usePageContext'

function LetterPerformancePage() {
  const { pageProps: ctx } = usePageContext()

  return (
    <Tabs.Content value="performance" className="pt-6">
      <div className="mb-3 flex items-center justify-between">
        <Heading size="xs">Email metrics</Heading>

        <Button>View recipients</Button>
      </div>
      <div className="w-full rounded-2xl flex flex-col lg:flex-row border border-(--border-tertiary) box-border">
        <div className="w-full lg:w-1/4 p-6 border-b lg:border-b-0 lg:border-r box-border border-(--border-tertiary)">
          <MetricCard
            rate={{ label: 'Emails delivered', value: '100%' }}
            value={{ label: 'Delivery rate', value: '97%' }}
          />
        </div>
        <div className="w-full lg:w-1/4 p-6 border-b lg:border-b-0 lg:border-r box-border border-(--border-tertiary)">
          <MetricCard
            rate={{ label: 'Open rate', value: '31.24%' }}
            value={{ label: 'Total email opens', value: '1,233' }}
          />
        </div>
        <div className="w-full lg:w-1/4 p-6 border-b lg:border-b-0 lg:border-r box-border border-(--border-tertiary)">
          <MetricCard
            rate={{ label: 'Click rate', value: '3.11%' }}
            value={{ label: 'Total link clicks', value: '2,103' }}
          />
        </div>
        <div className="w-full lg:w-1/4 box-border p-6">
          <MetricCard
            rate={{ label: 'Unsubscribe rate', value: '0.01%' }}
            value={{ label: 'Total unsubscribes', value: '302' }}
          />
        </div>
      </div>

      <div className="w-full mt-6 flex gap-4">
        <div className="w-full flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full flex items-center gap-2">
              <Text className="kb-content-tertiary shrink-0">Marked as spam</Text>

              <div className="w-full grow flex items-center">
                <div className="h-px w-full bg-(--border-tertiary)" />
              </div>

              <Text className="kb-content-secondary">2%</Text>
            </div>
          ))}
        </div>
        <div className="w-full flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full flex items-center gap-2">
              <Text className="kb-content-tertiary shrink-0">Marked as spam</Text>

              <div className="w-full grow flex items-center">
                <div className="h-px w-full bg-(--border-tertiary)" />
              </div>

              <Text className="kb-content-secondary">2%</Text>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between mt-6">
        <Heading size="xs">Web metrics</Heading>
      </div>
    </Tabs.Content>
  )
}

export { LetterPerformancePage as Page }
