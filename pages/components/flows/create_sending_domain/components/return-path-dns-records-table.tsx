import type { SendingDomain } from '#root/database/database_schema_types'
import { DnsRecordsTable, type DnsRecord } from './dns-records-table.jsx'

interface ReturnPathDnsRecordsTableProps {
  sendingDomain: SendingDomain
}

export function ReturnPathDnsRecordsTable({
  sendingDomain,
}: ReturnPathDnsRecordsTableProps) {
  const returnPathRecord: DnsRecord = {
    type: 'CNAME',
    hostname: `${sendingDomain.returnPathSubDomain}.${sendingDomain.name}`,
    value: sendingDomain.returnPathDomainCnameValue || '',
    verified: !!sendingDomain.returnPathDomainVerifiedAt,
  }

  return (
    <DnsRecordsTable records={[returnPathRecord]} title="Return Path Configuration" />
  )
}
