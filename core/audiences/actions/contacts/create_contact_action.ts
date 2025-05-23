import type { CreateContactDto } from '#root/core/audiences/dto/contacts/create_contact_dto.js'
import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'

import type { Audience } from '#root/database/database_schema_types.js'

import { container } from '#root/core/utils/typi.js'

export class CreateContactAction {
  constructor(private contactRepository = container.make(ContactRepository)) {}

  handle = async (payload: CreateContactDto, audience: Audience) => {
    const contact = await this.contactRepository.create({ ...payload }, audience)

    return contact
  }
}
