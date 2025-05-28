import { appEnv } from '#root/core/app/env/app_env.js'
import { type SentMessageInfo, type Transporter, createTransport } from 'nodemailer'
import { v4 as uuidV4 } from 'uuid'
import type { MailObject, MailerDriverResponse } from './mailer_types.js'

import { cuid } from '#root/core/shared/utils/cuid/cuid.js'

export class MailerClass {
  // a transport must be created for the team making this mail send call.
  // we decrypt the api key for this sender and we invoke the smtp server
  // using the team api key and username credentials.
  // this ensures that our reputation tracking engine on the smtp server still counts
  // reputation correctly for the sender based on their teamId and api key
  transport = createTransport({
    port: appEnv.SMTP_PORT,
    host: appEnv.SMTP_HOST,
    secure: true,
    auth: {
      user: appEnv.SMTP_USER,
      pass: appEnv.SMTP_PASS,
    },
    tls: {
      requestCert: appEnv.isProd,
      rejectUnauthorized: appEnv.isProd,
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

  personalise(personalise: Record<string, string | number | boolean | null | undefined>) {
    this.mail.personalise = personalise

    return this
  }

  content(html: string, text?: string | null) {
    this.mail.content = { html, text }

    return this
  }

  async send(): Promise<[MailerDriverResponse, Error | null]> {
    if (!this.mail.from || !this.mail.to || !this.mail.content || !this.mail.subject) {
      return [null, new Error('Incomplete mail object')] as unknown as [
        MailerDriverResponse,
        null,
      ]
    }

    // Run function to personalise mail object content based on personalise object.

    const messageId = `${uuidV4()}@kibamail.com`

    try {
      await this.transport.sendMail({
        from: `${this.mail.from.name ?? ''}<${this.mail.from.email}>`,
        to: `${this.mail.to.name ?? ''}<${this.mail.to.email}>`,
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
