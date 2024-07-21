import { CreateContactDto } from "@/domains/audiences/dto/contacts/create_contact_dto.js"
import { ContactRepository } from "@/domains/audiences/repositories/contact_repository.js"
import { container } from "@/utils/typi.js"

export class CreateContactAction {
  constructor(
    private contactRepository: ContactRepository = container.make(
      ContactRepository,
    ),
  ) {}

  handle = async (payload: CreateContactDto, audienceId: string) => {
    const audience = await this.contactRepository.createContact(
      { ...payload },
      audienceId,
    )

    return audience
  }
}
