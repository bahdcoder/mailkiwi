import { products } from '#root/database/schema.js'

import { BaseRepository } from '#root/core/shared/repositories/base_repository.js'

export class ProductRepository extends BaseRepository {
  products() {
    return this.crud(products)
  }

  async findById(id: string) {
    return this.products().findById(id)
  }
}
