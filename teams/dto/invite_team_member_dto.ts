import { type InferInput, email, nonEmpty, object, picklist, pipe, string } from 'valibot'

export const InviteTeamMember = object({
  email: pipe(string(), nonEmpty(), email()),
  role: pipe(picklist(['ADMINISTRATOR', 'MANAGER', 'AUTHOR', 'GUEST']), nonEmpty()),
})

export type InviteTeamMemberDto = InferInput<typeof InviteTeamMember>
