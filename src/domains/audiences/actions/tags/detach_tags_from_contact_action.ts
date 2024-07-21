import { ContactRepository } from "@/domains/audiences/repositories/contact_repository.js"
import { DetachTagsFromContactDto } from "@/domains/audiences/dto/tags/detach_tags_from_contact_dto.js"
import { container } from "@/utils/typi.js"

export class DetachTagsFromContactAction {
  constructor(
    private contactRepository: ContactRepository = container.make(
      ContactRepository,
    ),
  ) {}

  handle = async (contactId: string, payload: DetachTagsFromContactDto) => {
    return this.contactRepository.detachTags(contactId, payload.tagIds)
  }
}
