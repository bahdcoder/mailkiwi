import { type InferInput, nonEmpty, object, pipe, string } from 'valibot'

export const GetDomainHostsSchema = object({
  domain: pipe(
    string('Domain must be a text value'),
    nonEmpty('Please provide a domain name'),
  ),
})

export type GetDomainHostsDto = InferInput<typeof GetDomainHostsSchema>
