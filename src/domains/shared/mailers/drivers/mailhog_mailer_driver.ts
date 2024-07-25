import { cuid } from '@/domains/shared/utils/cuid/cuid.js'
import type {
  MailerDriver,
  MailerDriverError,
  MailerDriverResponse,
  MailObject,
} from '../mailer_types.ts'

export interface MailhogDriverResponse {
  ok: boolean
}

export interface MailhogDriverError {
  message: string
}

export class MailhogDriver implements MailerDriver {
  constructor(private baseUrl: string) {}

  async send(
    mail: MailObject,
  ): Promise<[MailerDriverResponse, MailerDriverError]> {
    try {
      const path = `${this.baseUrl}/api/send-email`

      d({
        [`Calling external api to send mail:${path}`]: mail.to.email,
      })

      const response = await fetch(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${mail.from.name} <${mail.from.email}>`,
          to: `${mail.to.name} <${mail.to.email}>`,
          subject: mail.subject,
          text: mail.content.text,
          html: mail.content.html,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.statusText}`)
      }

      d(await response.json())

      return [{ messageId: cuid() }, null]
    } catch (error) {
      return [
        null,
        error instanceof Error ? error : new Error('Unknown error occurred'),
      ] as unknown as [MailerDriverResponse, MailerDriverError]
    }
  }
}
