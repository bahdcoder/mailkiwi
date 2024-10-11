import { EmailSendRepository } from "@/email_sends/repositories/email_send_repository.js"
import { InjectEmailSchemaDto } from "@/injector/dto/inject_email_dto.js"

import { BaseJob, JobContext } from "@/shared/queue/abstract_job.js"

import { container } from "@/utils/typi.js"

export interface CreateEmailSendJobPayload {
  messageId: string
  html: InjectEmailSchemaDto
}

export class CreateEmailSendJob extends BaseJob<CreateEmailSendJobPayload> {
  static get id() {
    return "MTA_LOGS::CREATE_EMAIL_SEND"
  }

  async handle(ctx: JobContext<CreateEmailSendJobPayload>) {
    const emailSendRepository = container.make(EmailSendRepository)

    await emailSendRepository.create(ctx.payload.messageId, {
      sendingId: "",
    })
    return this.done()
  }

  async failed() {}
}
