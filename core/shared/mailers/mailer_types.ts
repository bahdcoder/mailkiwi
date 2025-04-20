export type MailerContact = {
  email: string
  name?: string
}

export type MailContent = {
  html?: string
  text?: string | null
}

export interface MailObject {
  subject: string
  preview?: string
  from: MailerContact
  to: MailerContact
  replyTo: MailerContact
  content: MailContent
  personalise?: Record<string, string | number | boolean | null | undefined>
}

export interface MailerDriverResponse {
  messageId: string
}

export type MailerDriverError = Error | null

export interface MailerDriver {
  send(mail: MailObject): Promise<[MailerDriverResponse, MailerDriverError]>
}
