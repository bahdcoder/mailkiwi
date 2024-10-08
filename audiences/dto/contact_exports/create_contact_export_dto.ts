import { type InferInput, object } from "valibot"

import { FilterGroupsSchema } from "@/audiences/dto/segments/create_segment_dto.js"

export const CreateContactExportSchema = object({
  filterGroups: FilterGroupsSchema,
})

export type CreateContactExportDto = InferInput<
  typeof CreateContactExportSchema
>
