import { Button } from '@kibamail/owly/button'
import { SettingsContainer } from '../components/settings-container.jsx'
import { CreateSendingDomainFlow } from '#root/pages/components/flows/create_sending_domain/create_sending_domain_flow.jsx'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'

function SettingsDomains() {
  return (
    <SettingsContainer
      title="Sending domains"
      description="Manage your sending domains for email delivery and authentication."
      actions={
        <CreateSendingDomainFlow product="send">
          <Button>Add sending domain</Button>
        </CreateSendingDomainFlow>
      }
    >
      <div className="w-full p-4 rounded-lg kb-background-hover">
        <Heading size="xs">No sending domains</Heading>
        <Text className="kb-content-tertiary">
          You have not added any sending domains yet. When you do, you will see a list of
          all your sending domains here.
        </Text>
      </div>
    </SettingsContainer>
  )
}

export { SettingsDomains as Page }
