import { CalendarIcon } from '#root/pages/components/icons/calendar.svg.jsx'
import { EditPencilIcon } from '#root/pages/components/icons/edit-pencil.svg.jsx'
import { GroupIcon } from '#root/pages/components/icons/group.svg.jsx'
import { NotesIcon } from '#root/pages/components/icons/notes.svg.jsx'
import { MetricCard } from '#root/pages/components/performance/metric-card.jsx'
import { BroadcastDetails } from '#root/pages/w/engage/broadcasts/@uuid/components/broadcast-details.jsx'
import * as Tabs from '@kibamail/owly/tabs'
import { Text } from '@kibamail/owly/text'
import { usePageContext } from 'vike-react/usePageContext'

function LetterOverviewPage() {
  const { pageProps: ctx } = usePageContext()

  return (
    <Tabs.Content value="overview" className="pt-6">
      {/* <BroadcastDetails /> */}

      <div className="w-full mt-9">
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
      </div>
    </Tabs.Content>
  )
}

export { LetterOverviewPage as Page }
