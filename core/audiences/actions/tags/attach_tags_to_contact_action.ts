import type { AttachTagsToContactDto } from '#root/core/audiences/dto/tags/attach_tags_to_contact_dto.js'
import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'

import { container } from '@kibamail/framework'

export class AttachTagsToContactAction {
  constructor(private contactRepository = container.make(ContactRepository)) {}

  handle = async (contactId: string, payload: AttachTagsToContactDto) => {
    await this.contactRepository.attachTags(contactId, payload.tags)
  }
}
