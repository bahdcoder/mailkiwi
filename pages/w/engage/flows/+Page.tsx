import { EmptyState } from '@/pages/components/empty-state/empty_state.jsx'
import { CreateAutomationFlow } from '@/pages/components/flows/create_automation/create_automation_flow.jsx'
import { Button } from '@kibamail/owly/button'
import * as Tabs from '@kibamail/owly/tabs'
import { usePageContext } from 'vike-react/usePageContext'

function EngageAutomationsPage() {
  const ctx = usePageContext()

  return (
    <EmptyState
      title="You haven’t created any flows yet"
      description="Create a flow to automate your email marketing."
    >
      <CreateAutomationFlow>
        <Button>Create a flow</Button>
      </CreateAutomationFlow>
    </EmptyState>
  )

  // return (
  //   <Tabs.Content value="automations">
  //     {[1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((_) => (
  //       <p key={_} className="my-6 kb-content-secondary">
  //         Automations here
  //       </p>
  //     ))}
  //   </Tabs.Content>
  // )
}

export { EngageAutomationsPage as Page }
