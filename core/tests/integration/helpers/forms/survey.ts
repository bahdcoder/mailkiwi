import type { InsertForm } from '#root/database/database_schema_types.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'

export const survey = {
  type: 'survey',
  name: 'Newsletter subscribers',
  fields: [
    {
      id: cuid(),
      type: 'select',
      label: "What's your role at your current employer?",
      options: ['Engineer', 'Designer', 'Product Manager', 'Other'],
      autoTagging: [{ option: 'Engineer', tagId: [cuid()] }],
    },
    {
      id: cuid(),
      type: 'select',
      label: 'How long have you been in this role ?',
      options: ['1 - 5 years', '10 - 15 years', '20+ years'],
      autoTagging: [{ option: '10 - 15 years', tagId: [cuid()] }],
    },
  ],
  appearance: 'inline',
} as InsertForm
