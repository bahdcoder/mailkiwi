import { mediaDocuments } from "@/database/schema.js"

import { makeDatabase } from "@/shared/container/index.js"
import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class MediaDocumentRepository extends BaseRepository {
  constructor(protected database = makeDatabase()) {
    super()
  }

  documents() {
    return this.crud(mediaDocuments)
  }
}
