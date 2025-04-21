import type { CreateContactDto } from '@/audiences/dto/contacts/create_contact_dto.js'
import { ContactRepository } from '@/audiences/repositories/contact_repository.js'

import type { Audience } from '@/database/database_schema_types.js'

import { container } from '@/utils/typi.js'

export class CreateContactAction {
  constructor(private contactRepository = container.make(ContactRepository)) {}

  handle = async (payload: CreateContactDto, audience: Audience) => {
    const contact = await this.contactRepository.create({ ...payload }, audience)

    return contact
  }
}
