import type { UpdateContactDto } from "@/audiences/dto/contacts/update_contact_dto.js";
import { ContactRepository } from "@/audiences/repositories/contact_repository.js";
import { E_VALIDATION_FAILED } from "@/http/responses/errors.js";
import { container } from "@/utils/typi.js";

export class UpdateContactAction {
  constructor(private contactRepository = container.make(ContactRepository)) {}

  handle = async (contactId: string, payload: UpdateContactDto) => {
    const contact = await this.contactRepository.findById(contactId);

    if (!contact) {
      throw E_VALIDATION_FAILED([
        {
          message: "Invalid contact provided.",
          field: "contactId",
        },
      ]);
    }

    const updatedAttributes = {
      ...contact.attributes,
      ...payload.attributes,
    };

    const updatedContact = {
      ...contact,
      ...payload,
      attributes: updatedAttributes,
    };

    return this.contactRepository.update(contactId, updatedContact);
  };
}
