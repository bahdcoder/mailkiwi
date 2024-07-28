import type {
  MailObject,
  MailerDriver,
  MailerDriverResponse,
} from './mailer_types.js'

// Mailer class
export class MailerClass {
  private driver: MailerDriver

  setDriver(driver: MailerDriver) {
    this.driver = driver

    return this
  }

  from(email: string, name?: string): MailBuilder {
    return new MailBuilder(this.driver).from(email, name)
  }
}

export const Mailer = new MailerClass()

export class MailBuilder {
  private mail: Partial<MailObject> = {}
  private driver: MailerDriver

  constructor(driver: MailerDriver) {
    this.driver = driver
  }

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

    return this.driver.send(this.mail as MailObject)
  }
}
