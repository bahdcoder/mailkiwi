import { env } from '@/shared/env/index.js'
import type { MailObject, MailerDriverResponse } from './mailer_types.js'
import {
  createTransport,
  type Transporter,
  type SentMessageInfo,
} from 'nodemailer'
import { v4 as uuidV4 } from 'uuid'
import { cuid } from '@/shared/utils/cuid/cuid.ts'

export class MailerClass {
  transport = createTransport({
    port: env.SMTP_PORT,
    host: env.SMTP_HOST,
    secure: env.isProd,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    tls: {
      requestCert: env.isProd,
      rejectUnauthorized: env.isProd,
    },
  })

  from(email: string, name?: string): MailBuilder {
    return new MailBuilder(this.transport).from(email, name)
  }
}

export const Mailer = new MailerClass()

export class MailBuilder {
  private mail: Partial<MailObject> = {}

  constructor(private transport: Transporter<SentMessageInfo>) {}

  from(email: string, name?: string): this {
    this.mail.from = { email, name }

    return this
  }

  subject(subject: string) {
    this.mail.subject = subject

    return this
  }

  to(email: string, name?: string): this {
    this.mail.to = { email, name }

    return this
  }

  replyTo(email: string, name?: string) {
    this.mail.replyTo = { email, name }

    return this
  }

  personalise(personalise: Record<string, any>) {
    this.mail.personalise = personalise

    return this
  }

  content(html: string, text?: string | null) {
    this.mail.content = { html, text }

    return this
  }

  async send(): Promise<[MailerDriverResponse, Error | null]> {
    if (
      !this.mail.from ||
      !this.mail.to ||
      !this.mail.content ||
      !this.mail.subject
    ) {
      return [null, new Error('Incomplete mail object')] as unknown as [
        MailerDriverResponse,
        null,
      ]
    }

    // Run function to personalise mail object content based on personalise object.

    const messageId = `${cuid()}-${uuidV4()}@kibamail.com`

    try {
      await this.transport.sendMail({
        messageId,
        from: `${this.mail.from.name} <${this.mail.from.email}>`,
        to: `${this.mail.to.name} <${this.mail.to.email}>`,
        subject: this.mail.subject,
        text: this.mail.content?.text as string,
        html: this.mail.content?.html,
        replyTo: `${this.mail.replyTo?.name} <${this.mail.replyTo?.email}>`,
      })
    } catch (error) {
      return [null, error] as unknown as [MailerDriverResponse, null]
    }

    return [{ messageId }, null]
  }
}
