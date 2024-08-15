import type { CreateContactDto } from '@/audiences/dto/contacts/create_contact_dto.js'
import { ContactRepository } from '@/audiences/repositories/contact_repository.js'
import { container } from '@/utils/typi.js'

export class CreateContactAction {
  constructor(private contactRepository = container.make(ContactRepository)) {}

  handle = async (payload: CreateContactDto, audienceId: string) => {
    const audience = await this.contactRepository.createContact(
      { ...payload },
      audienceId,
    )

    return audience
  }
}
