import { Button } from '@kibamail/owly/button'
import { SettingsContainer } from '../components/settings-container.jsx'
import { CreateApiKeyDialog } from '../components/create-api-key-dialog.jsx'

function SettingsApiKeys() {
  return (
    <SettingsContainer
      title="API keys management"
      description="Manage your API keys for programmatic access to Kibamail."
      actions={
        <CreateApiKeyDialog>
          <Button>Create new api key</Button>
        </CreateApiKeyDialog>
      }
    ></SettingsContainer>
  )
}

export { SettingsApiKeys as Page }
