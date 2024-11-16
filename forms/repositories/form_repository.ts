import { forms } from "@/database/schema.js"

import { BaseRepository } from "@/shared/repositories/base_repository.js"

export class FormRepository extends BaseRepository {
  forms() {
    return this.crud(forms)
  }
}
