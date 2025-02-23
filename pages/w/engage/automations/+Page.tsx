import * as Tabs from '@kibamail/owly/tabs'
import { usePageContext } from 'vike-react/usePageContext'

function LettersAutomationsPage() {
  const ctx = usePageContext()

  return (
    <Tabs.Content value="automations">
      {[1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((_) => (
        <p key={_} className="my-6 kb-content-secondary">
          Automations here
        </p>
      ))}
    </Tabs.Content>
  )
}

export { LettersAutomationsPage as Page }
