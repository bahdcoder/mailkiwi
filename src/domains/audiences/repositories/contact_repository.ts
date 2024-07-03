import { PrismaClient } from "@prisma/client"
import { inject, injectable } from "tsyringe"

import { ContainerKey } from "@/infrastructure/container"

import { CreateContactDto } from "../dto/contacts/create_contact_dto"

@injectable()
export class ContactRepository {
  constructor(@inject(ContainerKey.database) private database: PrismaClient) {}

  async createContact(payload: CreateContactDto) {
    const contacts = await this.database.contact.create({
      data: payload,
    })

    return contacts
  }
}
