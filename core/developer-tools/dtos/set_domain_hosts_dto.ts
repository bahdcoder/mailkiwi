import {
  type InferInput,
  array,
  nonEmpty,
  number,
  object,
  optional,
  picklist,
  pipe,
  string,
} from 'valibot'

export const DomainHostRecordSchema = object({
  name: pipe(
    string('Host name must be a text value'),
    nonEmpty('Please provide a host name'),
  ),
  type: picklist(
    ['A', 'AAAA', 'CNAME', 'MX', 'TXT'],
    'Please select a valid record type',
  ),
  address: pipe(
    string('Address must be a text value'),
    nonEmpty('Please provide an address'),
  ),
  ttl: optional(number('TTL must be a number')),
  mxPref: optional(number('MX preference must be a number')),
})

export const SetDomainHostsSchema = object({
  domain: pipe(
    string('Domain must be a text value'),
    nonEmpty('Please provide a domain name'),
  ),
  records: array(DomainHostRecordSchema, 'Please provide at least one record'),
})

export type DomainHostRecord = InferInput<typeof DomainHostRecordSchema>
export type SetDomainHostsDto = InferInput<typeof SetDomainHostsSchema>
