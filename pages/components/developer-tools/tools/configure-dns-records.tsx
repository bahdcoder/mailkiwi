import { Button } from '@kibamail/owly/button'
import * as SelectField from '@kibamail/owly/select-field'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import type React from 'react'

export function ConfigureDnsRecords() {
  const { serverFormProps, isPending, error, ServerErrorsList } = useServerFormMutation<{
    success: boolean
  }>({
    action: '/api/developer-tools/configure-dns-records', // This would be the actual API endpoint
    async onSuccess(data) {
      // Handle success - could show a toast or update UI
      console.log('DNS records configured:', data)
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <Text className="text-lg font-semibold kb-content-primary mb-2">
          Configure DNS Records
        </Text>
        <Text className="kb-content-secondary text-sm leading-relaxed">
          Set up DNS records for your domain. Fill in the form and submit to configure DNS
          records for your Kibamail applications.
        </Text>
      </div>

      <ServerForm {...serverFormProps}>
        <div className="space-y-4">
          <TextField.Root name="domain" placeholder="example.com" required>
            <TextField.Label>Domain Name</TextField.Label>
            {error?.errorsMap?.domain ? (
              <TextField.Error>{error?.errorsMap?.domain}</TextField.Error>
            ) : null}
          </TextField.Root>

          <div className="grid grid-cols-2 gap-4">
            <SelectField.Root defaultValue="A" name="recordType">
              <SelectField.Label>Record Type</SelectField.Label>
              <SelectField.Trigger />
              <SelectField.Content className="z-50 relative">
                <SelectField.Item value="A">A Record</SelectField.Item>
                <SelectField.Item value="AAAA">AAAA Record</SelectField.Item>
                <SelectField.Item value="CNAME">CNAME Record</SelectField.Item>
                <SelectField.Item value="MX">MX Record</SelectField.Item>
                <SelectField.Item value="TXT">TXT Record</SelectField.Item>
              </SelectField.Content>
              {error?.errorsMap?.recordType ? (
                <SelectField.Error>{error?.errorsMap?.recordType}</SelectField.Error>
              ) : null}
            </SelectField.Root>

            <TextField.Root
              name="ttl"
              type="number"
              defaultValue="3600"
              placeholder="3600"
            >
              <TextField.Label>TTL (seconds)</TextField.Label>
              {error?.errorsMap?.ttl ? (
                <TextField.Error>{error?.errorsMap?.ttl}</TextField.Error>
              ) : null}
            </TextField.Root>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField.Root name="recordName" placeholder="www" required>
              <TextField.Label>Name</TextField.Label>
              {error?.errorsMap?.recordName ? (
                <TextField.Error>{error?.errorsMap?.recordName}</TextField.Error>
              ) : null}
            </TextField.Root>

            <TextField.Root name="recordValue" placeholder="192.168.1.1" required>
              <TextField.Label>Value</TextField.Label>
              {error?.errorsMap?.recordValue ? (
                <TextField.Error>{error?.errorsMap?.recordValue}</TextField.Error>
              ) : null}
            </TextField.Root>
          </div>

          {ServerErrorsList}

          <div className="flex gap-3">
            <Button type="submit" loading={isPending} className="flex-1">
              Configure DNS Records
            </Button>
          </div>
        </div>
      </ServerForm>
    </div>
  )
}
