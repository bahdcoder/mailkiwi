import { Button } from '@kibamail/owly/button'
import { SettingsContainer } from '../components/settings-container.jsx'
import { CreateSendingDomainFlow } from '#root/pages/components/flows/create_sending_domain/create_sending_domain_flow.jsx'
import { ConfigureSendingDomain } from '#root/pages/components/flows/create_sending_domain/configure_sending_domain_modal.jsx'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import { usePageContextWithProps } from '#root/pages/hooks/use_page_props'
import { route } from '#root/core/shared/routes/route_aliases'
import { useServerQuery } from '#root/pages/hooks/use_server_query'
import { useServerFormMutation } from '#root/pages/hooks/use_server_form_mutation.jsx'
import { useQueryClient } from '@tanstack/react-query'
import type { SendingDomain } from '#root/database/database_schema_types'
import { DomainCard } from './components/domain-card.jsx'
import { useState } from 'react'

function SettingsDomains() {
  const ctx = usePageContextWithProps<{
    sendingDomains: SendingDomain[]
  }>()

  const [configureModalOpen, setConfigureModalOpen] = useState(false)
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null)

  console.log('@ctx.pageProps?.sendingDomains', ctx.pageProps?.sendingDomains)

  const { data, refetchQuery } = useServerQuery({
    queryKey: route('fetch_sending_domains'),
    initialData: { sendingDomains: ctx.pageProps?.sendingDomains || [] },
  })

  function handleConfigure(domainId: string) {
    setSelectedDomainId(domainId)
    setConfigureModalOpen(true)
  }

  function onConfigureModalClose() {
    setConfigureModalOpen(false)
    setSelectedDomainId(null)
  }

  return (
    <>
      <SettingsContainer
        title="Sending domains"
        description="Manage your sending domains for email delivery and authentication."
        actions={
          <CreateSendingDomainFlow onSuccess={refetchQuery}>
            <Button>Add sending domain</Button>
          </CreateSendingDomainFlow>
        }
      >
        {!data || data?.sendingDomains.length === 0 ? (
          <div className="w-full p-4 rounded-lg kb-background-hover">
            <Heading size="xs">No sending domains</Heading>
            <Text className="kb-content-tertiary">
              You have not added any sending domains yet. When you do, you will see a list
              of all your sending domains here.
            </Text>
          </div>
        ) : (
          <div className="space-y-4">
            {data.sendingDomains.map((domain) => (
              <DomainCard
                key={domain.id}
                domain={domain}
                onConfigure={handleConfigure}
                onDomainDeleted={refetchQuery}
              />
            ))}
          </div>
        )}
      </SettingsContainer>

      {selectedDomainId && (
        <ConfigureSendingDomain
          open={configureModalOpen}
          sendingDomainId={selectedDomainId}
          onOpenChange={setConfigureModalOpen}
          onDialogClosed={onConfigureModalClose}
        />
      )}
    </>
  )
}

export { SettingsDomains as Page }
