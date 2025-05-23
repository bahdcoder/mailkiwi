import { appEnv } from '#root/core/app/env/app_env.js'
import * as cheerio from 'cheerio'
import { simpleParser } from 'mailparser'

import { makeHttpClient } from '#root/core/shared/http/http_client.js'

export const clearAllMailpitMessages = async () => {
  await makeHttpClient().url(`${appEnv.MAILPIT_API_URL}/api/v1/messages`).delete().send()
}

type Envelope = {
  Name: string
  Address: string
}

export const getAllMailpitMessages = async () => {
  const { data } = await makeHttpClient<
    object,
    {
      total: number
      messages: {
        ID: string
        MessageID: string
        From: Envelope
        To: Envelope[]
        Cc: Envelope[]
        Bcc: Envelope[]
        ReplyTo: Envelope[]
        Subject: string
      }[]
    }
  >()
    .url(`${appEnv.MAILPIT_API_URL}/api/v1/messages`)
    .get()
    .send()

  return data
}

export const getMailpitMessageSource = async (messageId: string) => {
  const { data } = await makeHttpClient<object, string>()
    .url(`${appEnv.MAILPIT_API_URL}/api/v1/message/${messageId}/raw`)
    .asText()
    .get()
    .send()
  const source = await simpleParser(data as string)

  const $ = cheerio.load(source.html as string)
  return { data, source, $ }
}
