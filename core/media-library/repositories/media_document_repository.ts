import { mediaDocuments } from '#root/database/schema.js'

import { makeDatabase } from '#root/core/shared/container/index.js'
import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'

export class MediaDocumentRepository extends BaseRepository {
  constructor(protected database = makeDatabase()) {
    super()
  }

  documents() {
    return this.crud(mediaDocuments)
  }
}
