import { inject, injectable } from "tsyringe"
import { ContactRepository } from "@/domains/audiences/repositories/contact_repository"
import { CreateContactDto } from "@/domains/audiences/dto/contacts/create_contact_dto"

@injectable()
export class CreateContactAction {
  constructor(
    @inject(ContactRepository)
    private contactRepository: ContactRepository,
  ) {}

  handle = async (payload: CreateContactDto) => {
    const audience = await this.contactRepository.createContact(payload)

    return audience
  }
}
