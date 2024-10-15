import type { UpdateContactDto } from "@/audiences/dto/contacts/update_contact_dto.js"
import { ContactRepository } from "@/audiences/repositories/contact_repository.js"

import {
  Contact,
  ContactWithProperties,
} from "@/database/database_schema_types.js"

import { container } from "@/utils/typi.js"

export class UpdateContactAction {
  constructor(
    private contactRepository = container.make(ContactRepository),
  ) {}

  handle = async (
    contact: ContactWithProperties,
    payload: UpdateContactDto,
  ) => {
    return this.contactRepository.update(contact, payload)
  }
}
