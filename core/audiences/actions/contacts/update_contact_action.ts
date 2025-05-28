import type { UpdateContactDto } from '#root/core/audiences/dto/contacts/update_contact_dto.js'
import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'

import type {
  Audience,
  ContactWithProperties,
} from '#root/database/database_schema_types.js'

import { container } from '@kibamail/framework'

export class UpdateContactAction {
  constructor(private contactRepository = container.make(ContactRepository)) {}

  handle = async (
    contact: ContactWithProperties,
    audience: Audience,
    payload: UpdateContactDto,
  ) => {
    return this.contactRepository.update(contact, audience, payload)
  }
}
