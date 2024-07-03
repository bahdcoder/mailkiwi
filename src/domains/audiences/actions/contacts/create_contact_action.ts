import { inject, injectable } from "tsyringe"

import { CreateContactDto } from "@/domains/audiences/dto/contacts/create_contact_dto"
import { ContactRepository } from "@/domains/audiences/repositories/contact_repository"

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
