import type { AttachTagsToContactDto } from '@/audiences/dto/tags/attach_tags_to_contact_dto.js'
import { ContactRepository } from '@/audiences/repositories/contact_repository.js'
import { container } from '@/utils/typi.js'

export class AttachTagsToContactAction {
  constructor(private contactRepository = container.make(ContactRepository)) {}

  handle = async (contactId: string, payload: AttachTagsToContactDto) => {
    await this.contactRepository.attachTags(contactId, payload.tags)
  }
}
