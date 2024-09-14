import type { CreateContactDto } from "@/audiences/dto/contacts/create_contact_dto.js"
import { ContactRepository } from "@/audiences/repositories/contact_repository.js"

import { container } from "@/utils/typi.js"

export class CreateContactAction {
  constructor(
    private contactRepository = container.make(ContactRepository),
  ) {}

  handle = async (payload: CreateContactDto, audienceId: number) => {
    const audience = await this.contactRepository.create(
      { ...payload },
      audienceId,
    )

    return audience
  }
}
