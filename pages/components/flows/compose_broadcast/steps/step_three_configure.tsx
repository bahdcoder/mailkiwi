import type { SendingDomain } from '#root/database/database_schema_types.js'
import { SlashesDivider } from '#root/pages/components/flows/compose_broadcast/components/slashes_divider.jsx'
import { useComposeBroadcastContext } from '#root/pages/components/flows/compose_broadcast/state/compose_broadcast_context.jsx'
import { WarningTriangleSolidIcon } from '#root/pages/components/icons/warning-triangle-solid.svg.jsx'
import { usePageContextWithProps } from '#root/pages/hooks/use_page_props.js'

import * as Alert from '@kibamail/owly/alert'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import * as SelectField from '@kibamail/owly/select-field'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import React from 'react'

export function StepThreeConfigure() {
  const { pageProps } = usePageContextWithProps<{ sendingDomains: SendingDomain[] }>()

  const { formState, setFormState, syncContentToServerMutation } =
    useComposeBroadcastContext('StepThreeConfigure')

  const { error } = syncContentToServerMutation

  const engageSendingDomain = pageProps.sendingDomains.find(
    (domain) => domain.product === 'engage',
  )

  return (
    <div className="w-full max-w-[480px] mx-auto pt-16">
      <Heading>Email settings</Heading>

      <Text className="kb-content-tertiary mt-2">
        Define the email content for this broadcast
      </Text>

      <div className="grid grid-cols-1 gap-6 mt-6">
        <TextField.Root
          value={formState.subject}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              subject: event.target.value,
            }))
          }
        >
          <TextField.Label>Subject</TextField.Label>
          {error?.errorsMap?.['emailContent.subject'] && (
            <TextField.Error>{error.errorsMap['emailContent.subject']}</TextField.Error>
          )}
        </TextField.Root>

        <TextField.Root
          value={formState.previewText}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              previewText: event.target.value,
            }))
          }
        >
          <TextField.Label>Preview text</TextField.Label>
          {error?.errorsMap?.['emailContent.previewText'] && (
            <TextField.Error>
              {error.errorsMap['emailContent.previewText']}
            </TextField.Error>
          )}
        </TextField.Root>
      </div>

      <SlashesDivider />

      <div className="mt-6">
        <Heading size="xs">Sender details</Heading>

        <Text className="kb-content-tertiary mt-2">
          Choose the email address that will be used to send this broadcast
        </Text>
      </div>

      {engageSendingDomain ? (
        <div className="mt-6 grid grid-cols-1 gap-4">
          <SelectField.Root
            value={formState.senderIdentityId}
            onValueChange={(value) =>
              setFormState((current) => ({
                ...current,
                senderIdentityId: value,
              }))
            }
          >
            <SelectField.Label>Sender Identity</SelectField.Label>
            <SelectField.Trigger />
            <SelectField.Content>
              {/* TODO: Fetch sender identities and populate this dropdown */}
              <SelectField.Item value="default">Default Sender</SelectField.Item>
            </SelectField.Content>
            {error?.errorsMap?.senderIdentityId && (
              <SelectField.Error>{error.errorsMap.senderIdentityId}</SelectField.Error>
            )}
          </SelectField.Root>
        </div>
      ) : null}

      {!engageSendingDomain ? (
        <div className="mt-6">
          <Alert.Root variant="warning">
            <Alert.Icon>
              <WarningTriangleSolidIcon />
            </Alert.Icon>
            <Alert.Title className="font-semibold">
              Configure a sending domain
            </Alert.Title>
            <Text>
              To maintain high deliverability rates and build your own sender reputation,
              please setup at least one custom sending domain for this team.
            </Text>
            <Button variant="tertiary" className="pl-0 underline">
              Configure domain
            </Button>
          </Alert.Root>
        </div>
      ) : null}
    </div>
  )
}
