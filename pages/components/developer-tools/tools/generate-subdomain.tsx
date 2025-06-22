import { Button } from '@kibamail/owly/button'
import * as SelectField from '@kibamail/owly/select-field'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import type React from 'react'
import { Heading } from '@kibamail/owly/heading'
import { toast } from 'sonner'

interface SubdomainResponse extends Record<string, unknown> {
  id: string
  subdomain: string
  domain: string
  fullDomain: string
  externalId: string
  createdAt: string
}

export function GenerateSubdomain() {
  const { serverFormProps, isPending, error, ServerErrorsList } =
    useServerFormMutation<SubdomainResponse>({
      action: '/developer-tools/dns/generate-subdomain',
      async onSuccess(response) {
        console.log('Subdomain generated:', response)
        if (response.payload) {
          toast.success(
            `Successfully generated subdomain: ${response.payload.fullDomain}`,
            {
              description: `Your new subdomain is ready to use at ${response.payload.fullDomain}`,
            },
          )
        }
      },
      onError(error) {
        console.error('Failed to generate subdomain:', error)
        toast.error('Failed to generate subdomain', {
          description: 'Please check your input and try again.',
        })
      },
    })

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <Heading size="sm" className="text-lg font-semibold kb-content-primary mb-2">
          Generate Subdomain
        </Heading>
        <Text className="kb-content-secondary text-sm leading-relaxed">
          Generate a new subdomain for testing or development purposes. Enter a subdomain
          prefix, select a domain, and submit to create a unique subdomain URL that you
          can use for DNS testing.
        </Text>
      </div>

      <ServerForm {...serverFormProps}>
        <div className="space-y-4">
          <TextField.Root name="subdomainPrefix" placeholder="my-app" required>
            <TextField.Label>Subdomain Prefix</TextField.Label>
            {error?.errorsMap?.subdomainPrefix ? (
              <TextField.Error>{error?.errorsMap?.subdomainPrefix}</TextField.Error>
            ) : null}
            <TextField.Hint>
              Only lowercase letters, numbers, and hyphens are allowed
            </TextField.Hint>
          </TextField.Root>

          <SelectField.Root defaultValue="kibamail.xyz" name="domain">
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

          <div className="flex gap-3">
            <Button type="submit" loading={isPending} className="flex-1">
              Generate Subdomain
            </Button>
          </div>
        </div>
      </ServerForm>
    </div>
  )
}
