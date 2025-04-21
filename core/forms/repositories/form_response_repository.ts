import { formResponses } from '@/database/schema.js'

import { BaseRepository } from '@/shared/repositories/base_repository.js'

export class FormResponseRepository extends BaseRepository {
  responses() {
    return this.crud(formResponses)
  }
}
