type MailerContact = {
  email: string
  name?: string
}

type MailContent = {
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

type MailerDriverError = Error | null

interface MailerDriver {
  send(mail: MailObject): Promise<[MailerDriverResponse, MailerDriverError]>
}
