import { products } from '@/database/schema.js'

import { BaseRepository } from '@/shared/repositories/base_repository.js'

export class ProductRepository extends BaseRepository {
  products() {
    return this.crud(products)
  }

  async findById(id: string) {
    return this.products().findById(id)
  }
}
