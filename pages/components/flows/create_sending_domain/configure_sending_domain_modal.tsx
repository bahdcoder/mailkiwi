import * as Dialog from '@kibamail/owly/dialog'
import { Button } from '@kibamail/owly/button'
import { Text } from '@kibamail/owly/text'
import type React from 'react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { CancelIcon } from '#root/pages/components/icons/cancel.svg.jsx'
import { Heading } from '@kibamail/owly/heading'
import { Badge } from '@kibamail/owly/badge'
import { SlashesDivider } from '../compose_broadcast/components/slashes_divider.jsx'
import { useServerQuery } from '#root/pages/hooks/use_server_query'
import { DkimDnsRecordsTable } from './components/dkim-dns-records-table.jsx'
import { ReturnPathDnsRecordsTable } from './components/return-path-dns-records-table.jsx'
import { TrackingDnsRecordsTable } from './components/tracking-dns-records-table.jsx'
import type { SendingDomain } from '#root/database/database_schema_types'
import { useState } from 'react'
import dayjs from 'dayjs'

// @ts-ignore
import relativeTimePlugin from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTimePlugin)

interface ConfigureSendingDomainProps {
  open: boolean
  sendingDomainId: string
  onOpenChange: (open: boolean) => void
  onDialogClosed?: () => void
}

export function ConfigureSendingDomain({
  open,
  onOpenChange: onDialogOpenChange,
  sendingDomainId,
  onDialogClosed,
}: ConfigureSendingDomainProps) {
  const [checkRecords, setCheckRecords] = useState(false)

  const { data, isFetching, refetchQuery } = useServerQuery<SendingDomain>({
    queryKey: [
      `/sending_domains/${sendingDomainId}?check=${checkRecords ? 'true' : 'false'}`,
    ],
    enabled: sendingDomainId !== undefined,
  })

  console.log('Sending domain data:', data)

  function onOpenChange(open: boolean) {
    onDialogOpenChange(open)

    if (!open) {
      onDialogClosed?.()
    }
  }

  function onVerifyRecords() {
    setCheckRecords(true)
    refetchQuery()
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="!max-w-none !max-h-none !top-0 !left-0 !transform-none h-screen !rounded-none w-full overflow-auto">
        <VisuallyHidden>
          <Dialog.Header>
            <Dialog.Title>Configure sending domain</Dialog.Title>
            <Dialog.Description>
              Configure DNS records for your sending domain
            </Dialog.Description>
          </Dialog.Header>
        </VisuallyHidden>

        <div className="w-full h-16 flex items-center justify-end px-6 lg:px-12 shrink-0">
          <Dialog.Close asChild>
            <Button variant="secondary">
              <CancelIcon />
            </Button>
          </Dialog.Close>
        </div>

        <div className="w-full max-w-4xl mt-8 mx-auto">
          <div className="mb-2">
            <img src="/logos/logo-icon.png" width={32} height={32} alt="logo" />
          </div>
          <Heading>Configure your domain name</Heading>
          <Text className="kb-content-tertiary">
            Head to your DNS provider and add DKIM and Return-Path DNS record to verify
            your domain and ensure effective delivery.
          </Text>

          <div className="mt-6 flex items-center gap-3 pb-6 border-b border-(--border-tertiary)">
            <Button onClick={onVerifyRecords} loading={isFetching}>
              Verify records
            </Button>

            <Button variant="tertiary">Send instructions to a developer</Button>
          </div>

          <div className="pt-6 pb-1 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Text className="kb-content-tertiary">{data?.name}</Text>

              <Badge size="sm" variant="neutral">
                Not started
              </Badge>
            </div>

            <Text className="kb-content-tertiary">
              Last verified {dayjs(data?.recordsLastVerifiedAt || new Date()).fromNow()}
            </Text>
          </div>

          <SlashesDivider count={110} />

          <div className="flex flex-col gap-12 pb-16">
            <div className="flex flex-col w-full gap-6">
              <div className="flex items-center gap-4">
                <Heading size="xs" className="kb-content-secondary !font-normal !text-sm">
                  Return path records
                </Heading>

                <Text className="kb-content-tertiary">
                  Configure this so we can automatically handle email bounces and errors
                  for you.
                </Text>
              </div>

              {data && <ReturnPathDnsRecordsTable sendingDomain={data} />}
            </div>

            <div className="flex flex-col w-full gap-6">
              <div className="flex items-center gap-4">
                <Heading size="xs" className="kb-content-secondary !font-normal !text-sm">
                  DKIM records
                </Heading>

                <Text className="kb-content-tertiary">
                  Securely sign all your emails to comply with email provider
                  requirements.
                </Text>
              </div>

              {data && <DkimDnsRecordsTable sendingDomain={data} />}
            </div>

            <div className="flex flex-col w-full gap-6">
              <div className="flex items-center gap-4">
                <Heading size="xs" className="kb-content-secondary !font-normal !text-sm">
                  Tracking domain records
                </Heading>

                <Text className="kb-content-tertiary">
                  Send emails with your domain branded links to highly improve your email
                  deliverability
                </Text>
              </div>

              {data && <TrackingDnsRecordsTable sendingDomain={data} />}
            </div>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  )
}
