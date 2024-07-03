import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { container, inject, injectable } from "tsyringe"

import { CreateContactAction } from "@/domains/audiences/actions/contacts/create_contact_action"
import { CreateContactSchema } from "@/domains/audiences/dto/contacts/create_contact_dto"
import { AudiencePolicy } from "@/domains/audiences/policies/audience_policy"
import { ContactRepository } from "@/domains/audiences/repositories/contact_repository"
import { E_UNAUTHORIZED, E_VALIDATION_FAILED } from "@/http/responses/errors"
import { ContainerKey } from "@/infrastructure/container"

@injectable()
export class ContactController {
  constructor(
    @inject(ContactRepository) private contactRepository: ContactRepository,
    @inject(ContainerKey.app) private app: FastifyInstance,
  ) {
    this.app.defineRoutes([["POST", "/", this.store.bind(this)]], {
      prefix: "contacts",
    })
  }

  async index(request: FastifyRequest, response: FastifyReply) {
    return response.send([])
  }

  async store(request: FastifyRequest, _: FastifyReply) {
    const { success, error, data } = CreateContactSchema.safeParse(request.body)

    if (!success) throw E_VALIDATION_FAILED(error)

    const policy = container.resolve<AudiencePolicy>(AudiencePolicy)

    if (!policy.canCreate(request.team, request.accessToken.userId!))
      throw E_UNAUTHORIZED()

    const action = container.resolve<CreateContactAction>(CreateContactAction)

    const audience = await action.handle(data)

    return { data: audience }
  }
}
