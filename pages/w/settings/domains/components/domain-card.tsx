import { Badge } from '@kibamail/owly/badge'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import type { SendingDomain } from '#root/database/database_schema_types'
import { InfoCircleIcon } from '#root/pages/components/icons/info-circle.svg.jsx'
import { CheckCircleIcon } from '#root/pages/components/icons/check-circle.svg.jsx'
import { DomainActionsMenu } from '#root/pages/components/flows/create_sending_domain/components/domain-actions-menu.jsx'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { route } from '#root/core/shared/routes/route_aliases'
import React from 'react'

interface DomainCardProps {
  domain: SendingDomain
  onDomainDeleted?: () => void
  onConfigure?: (domainId: string) => void
}

export function DomainCard({ domain, onConfigure, onDomainDeleted }: DomainCardProps) {
  const queryClient = useQueryClient()
  const sendingDomainsQueryKey = [route('fetch_sending_domains')]

  const verifyRecordsMutation = useMutation({
    async mutationFn() {
      const response = await fetch(`/sending_domains/${domain.id}?check=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const json = await response.json()
      return json.payload as SendingDomain
    },
    onSuccess(updatedDomain: SendingDomain) {
      queryClient.setQueryData(
        sendingDomainsQueryKey,
        (oldData: { sendingDomains: SendingDomain[] } | undefined) => {
          if (!oldData) return oldData

          return {
            ...oldData,
            sendingDomains: oldData.sendingDomains.map((domain) =>
              domain.id === updatedDomain.id ? updatedDomain : domain,
            ),
          }
        },
      )
    },
  })

  function getDkimStatus() {
    return domain.dkimVerifiedAt ? 'success' : 'pending'
  }

  function getReturnPathStatus() {
    return domain.returnPathDomainVerifiedAt ? 'success' : 'pending'
  }

  function getTrackingStatus() {
    return domain.trackingDomainVerifiedAt ? 'success' : 'pending'
  }

  function isFullyVerified() {
    return (
      domain.dkimVerifiedAt &&
      domain.returnPathDomainVerifiedAt &&
      domain.trackingDomainVerifiedAt
    )
  }

  function onVerify() {
    verifyRecordsMutation.mutate()
  }

  return (
    <div className="w-full p-4 rounded-lg kb-background-hover border kb-border-tertiary">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <Heading size="xs">{domain.name}</Heading>
            <Badge variant="neutral" size="sm" className="uppercase text-xs">
              {domain.product === 'send' ? 'SEND - TRANSACTIONAL' : 'ENGAGE - MARKETING'}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={getDkimStatus() === 'success' ? 'success' : 'warning'}
              size="sm"
            >
              Dkim {getDkimStatus() === 'success' ? 'verified' : 'pending'}{' '}
              {getDkimStatus() === 'success' ? <CheckCircleIcon /> : <InfoCircleIcon />}
            </Badge>

            <Badge
              variant={getReturnPathStatus() === 'success' ? 'success' : 'warning'}
              size="sm"
            >
              Return path {getReturnPathStatus() === 'success' ? 'verified' : 'pending'}{' '}
              {getReturnPathStatus() === 'success' ? (
                <CheckCircleIcon />
              ) : (
                <InfoCircleIcon />
              )}
            </Badge>

            <Badge
              variant={getTrackingStatus() === 'success' ? 'success' : 'warning'}
              size="sm"
            >
              Tracking records{' '}
              {getTrackingStatus() === 'success' ? 'verified' : 'pending'}{' '}
              {getTrackingStatus() === 'success' ? (
                <CheckCircleIcon />
              ) : (
                <InfoCircleIcon />
              )}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2 ml-4">
          <Button variant="secondary" onClick={() => onConfigure?.(domain.id)}>
            {isFullyVerified() ? 'View' : 'Configure'} records
          </Button>

          {!isFullyVerified() && (
            <Button
              variant="primary"
              onClick={onVerify}
              loading={verifyRecordsMutation.isPending}
            >
              Verify records
            </Button>
          )}

          <DomainActionsMenu sendingDomain={domain} onDomainDeleted={onDomainDeleted} />
        </div>
      </div>
    </div>
  )
}
