import { Button } from '@kibamail/owly/button'
import * as SelectField from '@kibamail/owly/select-field'
import { Text } from '@kibamail/owly/text'
import * as Alert from '@kibamail/owly/alert'
import { Badge } from '@kibamail/owly/badge'
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import type React from 'react'
import { Heading } from '@kibamail/owly/heading'
import { CheckCircleSolidIcon } from '#root/pages/components/icons/check-circle-solid.svg.jsx'

interface DomainHost {
  id: string
  name: string
  type: string
  address: string
  ttl: string
  mxPref: string | null
  isActive: boolean
  friendlyName: string
  associatedAppTitle: string
  isDDNSEnabled: boolean
}

interface DomainHostsResponse extends Record<string, unknown> {
  domain: string
  hosts: DomainHost[]
}

export function ViewDomainRecords() {
  const { serverFormProps, isPending, error, ServerErrorsList, isSuccess, data } =
    useServerFormMutation<DomainHostsResponse>({
      action: '/developer-tools/dns/view-domain-hosts',
    })

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <Heading size="sm" className="text-lg font-semibold kb-content-primary mb-2">
          View All Domain Records
        </Heading>
        <Text className="kb-content-secondary text-sm leading-relaxed">
          View all DNS records for a specific domain. Select a domain to fetch and display
          all its current DNS records from Namecheap.
        </Text>
      </div>

      <ServerForm {...serverFormProps}>
        <div className="space-y-4">
          <SelectField.Root name="domain" required>
            <SelectField.Label>Select Domain</SelectField.Label>
            <SelectField.Trigger />
            <SelectField.Content className="z-100 relative">
              <SelectField.Item value="kibamail.xyz">kibamail.xyz</SelectField.Item>
              <SelectField.Item value="kibamail.online">kibamail.online</SelectField.Item>
            </SelectField.Content>
            {error?.errorsMap?.domain ? (
              <SelectField.Error>{error?.errorsMap?.domain}</SelectField.Error>
            ) : null}
          </SelectField.Root>

          {ServerErrorsList}

          {isSuccess && data?.payload && (
            <Alert.Root variant="success">
              <Alert.Icon>
                <CheckCircleSolidIcon />
              </Alert.Icon>
              <Alert.Title>
                Successfully fetched {data.payload.hosts.length} DNS records for{' '}
                {data.payload.domain}
              </Alert.Title>
            </Alert.Root>
          )}

          <div className="flex gap-3">
            <Button type="submit" loading={isPending} className="flex-1">
              Fetch Domain Records
            </Button>
          </div>
        </div>
      </ServerForm>

      {isSuccess && data?.payload && (
        <div className="mt-6">
          <Heading size="xs" className="mb-4">
            DNS Records for {data.payload.domain}
          </Heading>

          {data.payload.hosts.length === 0 ? (
            <div className="p-4 rounded-lg kb-background-hover">
              <Text className="kb-content-secondary">
                No DNS records found for this domain.
              </Text>
            </div>
          ) : (
            <div className="space-y-3">
              {data.payload.hosts.map((host) => (
                <div
                  key={host.id}
                  className="p-4 border rounded-lg kb-background-hover space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Text className="font-medium">{host.name || '@'}</Text>
                      <Badge size="sm" variant={host.isActive ? 'success' : 'neutral'}>
                        {host.type}
                      </Badge>
                      {!host.isActive && <Badge variant="warning">Inactive</Badge>}
                    </div>
                    <Text className="text-xs kb-content-tertiary">TTL: {host.ttl}s</Text>
                  </div>

                  <div>
                    <Text className="kb-content-secondary break-all">{host.address}</Text>
                  </div>

                  {host.friendlyName && (
                    <div>
                      <Text className="text-xs kb-content-tertiary">
                        {host.friendlyName}
                      </Text>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
