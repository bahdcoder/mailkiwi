import { formResponses } from '#root/database/schema.js'

import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'

export class FormResponseRepository extends BaseRepository {
  responses() {
    return this.crud(formResponses)
  }
}
