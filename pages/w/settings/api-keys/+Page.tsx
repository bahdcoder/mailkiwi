import { Button } from '@kibamail/owly/button'
import { SettingsContainer } from '../components/settings-container.jsx'
import { CreateApiKeyDialog } from '../components/create-api-key-dialog.jsx'
import { usePageContextWithProps } from '#root/pages/hooks/use_page_props'
import { route } from '#root/core/shared/routes/route_aliases'
import { useServerQuery } from '#root/pages/hooks/use_server_query'
import type { AccessToken } from '#root/database/database_schema_types'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import { ApiKeysTable } from './components/api-keys-table.js'

function SettingsApiKeys() {
  const ctx = usePageContextWithProps<{
    apiKeys: AccessToken[]
  }>()

  const { data, enableQuery } = useServerQuery({
    queryKey: route('fetch_api_keys'),
    initialData: { apiKeys: ctx.pageProps?.apiKeys || [] },
  })

  return (
    <SettingsContainer
      title="API keys management"
      description="Manage your API keys for programmatic access to Kibamail."
      actions={
        <CreateApiKeyDialog onApiKeyCreated={enableQuery}>
          <Button>Create new api key</Button>
        </CreateApiKeyDialog>
      }
    >
      {!data || data?.apiKeys.length === 0 ? (
        <div className="w-full p-4 rounded-lg kb-background-hover">
          <Heading size="xs">No api keys</Heading>
          <Text className="kb-content-tertiary">
            You have not created any api keys yet. When you do, you will see a list of all
            your api keys here.
          </Text>
        </div>
      ) : (
        <ApiKeysTable apiKeys={data.apiKeys} />
      )}
    </SettingsContainer>
  )
}

export { SettingsApiKeys as Page }
