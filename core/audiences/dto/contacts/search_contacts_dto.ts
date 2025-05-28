import { type InferInput, object } from 'valibot'

import { FilterGroupsSchema } from '#root/core/audiences/dto/segments/create_segment_dto.js'

export const SearchContactsSchema = object({
  filters: FilterGroupsSchema,
})

export type SearchContactsDto = InferInput<typeof SearchContactsSchema>
