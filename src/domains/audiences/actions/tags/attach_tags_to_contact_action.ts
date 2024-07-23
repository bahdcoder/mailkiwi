import type { AttachTagsToContactDto } from '@/domains/audiences/dto/tags/attach_tags_to_contact_dto.ts'
import { ContactRepository } from '@/domains/audiences/repositories/contact_repository.js'
import { container } from '@/utils/typi.js'

export class AttachTagsToContactAction {
  constructor(
    private contactRepository: ContactRepository = container.make(
      ContactRepository,
    ),
  ) {}

  handle = async (contactId: string, payload: AttachTagsToContactDto) => {
    await this.contactRepository.attachTags(contactId, payload.tags)
  }
}
