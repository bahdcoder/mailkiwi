import { Badge } from '@kibamail/owly/badge'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import type { SendingDomain } from '#root/database/database_schema_types'
import { CheckCircleIcon } from '#root/pages/components/icons/check-circle.svg.jsx'
import { DomainActionsMenu } from '#root/pages/components/flows/create_sending_domain/components/domain-actions-menu.jsx'

interface DomainCardProps {
  domain: SendingDomain
  onConfigure?: (domainId: string) => void
  onVerify?: (domainId: string) => void
  onDomainDeleted?: () => void
}

export function DomainCard({
  domain,
  onConfigure,
  onVerify,
  onDomainDeleted,
}: DomainCardProps) {
  const getDkimStatus = () => {
    return domain.dkimVerifiedAt ? 'success' : 'pending'
  }

  const getReturnPathStatus = () => {
    return domain.returnPathDomainVerifiedAt ? 'success' : 'pending'
  }

  const getTrackingStatus = () => {
    return domain.trackingDomainVerifiedAt ? 'success' : 'pending'
  }

  const isFullyVerified = () => {
    return (
      domain.dkimVerifiedAt &&
      domain.returnPathDomainVerifiedAt &&
      domain.trackingDomainVerifiedAt
    )
  }

  return (
    <div className="w-full p-4 rounded-lg kb-background-hover border kb-border-tertiary">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <Heading size="xs">{domain.name}</Heading>
            <Badge variant="neutral" size="sm" className="uppercase text-xs">
              {domain.product}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={getDkimStatus() === 'success' ? 'success' : 'warning'}
              size="sm"
            >
              DKIM: {getDkimStatus() === 'success' ? 'Verified' : 'Pending'}
            </Badge>

            <Badge
              variant={getReturnPathStatus() === 'success' ? 'success' : 'warning'}
              size="sm"
            >
              Return Path: {getReturnPathStatus() === 'success' ? 'Verified' : 'Pending'}
            </Badge>

            <Badge
              variant={getTrackingStatus() === 'success' ? 'success' : 'warning'}
              size="sm"
            >
              Tracking: {getTrackingStatus() === 'success' ? 'Verified' : 'Pending'}
            </Badge>
          </div>

          {isFullyVerified() && (
            <Text className="kb-content-success text-sm">
              ✓ Domain is fully configured and ready for sending
            </Text>
          )}
        </div>

        <div className="flex gap-2 ml-4">
          <Button variant="secondary" onClick={() => onConfigure?.(domain.id)}>
            Configure records
          </Button>

          {!isFullyVerified() && (
            <Button variant="primary" onClick={() => onVerify?.(domain.id)}>
              <CheckCircleIcon />
              Verify domain
            </Button>
          )}

          <DomainActionsMenu sendingDomain={domain} onDomainDeleted={onDomainDeleted} />
        </div>
      </div>
    </div>
  )
}
