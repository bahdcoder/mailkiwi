import { type InferInput, nonEmpty, object, picklist, pipe, string } from 'valibot'

export const CreateSubdomainSchema = object({
  subdomainPrefix: pipe(
    string('Subdomain prefix must be a text value'),
    nonEmpty('Please provide a subdomain prefix'),
  ),
  domain: picklist(['kibamail.xyz', 'kibamail.online'], 'Please select a valid domain'),
})

export type CreateSubdomainDto = InferInput<typeof CreateSubdomainSchema>
