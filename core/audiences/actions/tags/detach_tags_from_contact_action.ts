import type { DetachTagsFromContactDto } from '#root/core/audiences/dto/tags/detach_tags_from_contact_dto.js'
import { ContactRepository } from '#root/core/audiences/repositories/contact_repository.js'

import { container } from '#root/core/utils/typi.js'

export class DetachTagsFromContactAction {
  constructor(private contactRepository = container.make(ContactRepository)) {}

  handle = async (contactId: string, payload: DetachTagsFromContactDto) => {
    return this.contactRepository.detachTags(contactId, payload.tagIds)
  }
}
