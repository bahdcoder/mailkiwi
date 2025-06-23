import type { SendingDomain } from '#root/database/database_schema_types'
import { DnsRecordsTable, type DnsRecord } from './dns-records-table.jsx'

interface TrackingDnsRecordsTableProps {
  sendingDomain: SendingDomain
}

export function TrackingDnsRecordsTable({ sendingDomain }: TrackingDnsRecordsTableProps) {
  const trackingRecord: DnsRecord = {
    type: 'CNAME',
    hostname: `${sendingDomain.trackingSubDomain}.${sendingDomain.name}`,
    value: sendingDomain.trackingDomainCnameValue || '',
    verified: !!sendingDomain.trackingDomainVerifiedAt,
  }

  return <DnsRecordsTable records={[trackingRecord]} title="Tracking Configuration" />
}
