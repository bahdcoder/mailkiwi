import type { SendingDomain } from '#root/database/database_schema_types'
import { DnsRecordsTable, type DnsRecord } from './dns-records-table.jsx'

interface DkimDnsRecordsTableProps {
  sendingDomain: SendingDomain
}

export function DkimDnsRecordsTable({ sendingDomain }: DkimDnsRecordsTableProps) {
  const dkimRecord: DnsRecord = {
    type: 'TXT',
    hostname: `${sendingDomain.dkimSubDomain}.${sendingDomain.name}`,
    value: `k=rsa;p=${
      sendingDomain.dkimPublicKey
        ?.replace(/-----BEGIN PUBLIC KEY-----\n/, '')
        .replace(/\n-----END PUBLIC KEY-----\n/, '')
        .replace(/\n/g, '') || ''
    }`,
    verified: !!sendingDomain.dkimVerifiedAt,
  }

  return <DnsRecordsTable records={[dkimRecord]} title="DKIM Configuration" />
}
