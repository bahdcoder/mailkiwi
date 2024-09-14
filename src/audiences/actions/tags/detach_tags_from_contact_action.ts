import type { DetachTagsFromContactDto } from "@/audiences/dto/tags/detach_tags_from_contact_dto.js"
import { ContactRepository } from "@/audiences/repositories/contact_repository.js"

import { container } from "@/utils/typi.js"

export class DetachTagsFromContactAction {
  constructor(
    private contactRepository = container.make(ContactRepository),
  ) {}

  handle = async (
    contactId: number,
    payload: DetachTagsFromContactDto,
  ) => {
    return this.contactRepository.detachTags(contactId, payload.tagIds)
  }
}
