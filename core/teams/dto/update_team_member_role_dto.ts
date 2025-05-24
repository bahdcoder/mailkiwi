import { type InferInput, nonEmpty, object, picklist, pipe } from 'valibot'

export const UpdateTeamMemberRole = object({
  role: pipe(picklist(['ADMINISTRATOR', 'MANAGER', 'AUTHOR', 'GUEST']), nonEmpty()),
})

export type UpdateTeamMemberRoleDto = InferInput<typeof UpdateTeamMemberRole>
