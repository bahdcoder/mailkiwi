import { type InferInput, nonEmpty, object, picklist, pipe, string } from 'valibot'

export const CreateDnsRecordSchema = object({
  domain: pipe(
    string('Domain must be a text value'),
    nonEmpty('Please provide a domain name'),
  ),
  recordType: picklist(
    ['A', 'AAAA', 'CNAME', 'MX', 'TXT'],
    'Please select a valid record type',
  ),
  recordName: pipe(
    string('Record name must be a text value'),
    nonEmpty('Please provide a record name'),
  ),
  recordValue: pipe(
    string('Record value must be a text value'),
    nonEmpty('Please provide a record value'),
  ),
  ttl: pipe(string('TTL must be a text value'), nonEmpty('Please provide a TTL value')),
})

export type CreateDnsRecordDto = InferInput<typeof CreateDnsRecordSchema>
