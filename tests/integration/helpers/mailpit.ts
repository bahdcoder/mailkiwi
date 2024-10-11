import { apiEnv } from "@/api/env/api_env.js"
import * as cheerio from "cheerio"
import { simpleParser } from "mailparser"

import { makeHttpClient } from "@/shared/http/http_client.js"

export const clearAllMailpitMessages = async () => {
  await makeHttpClient()
    .url(`${apiEnv.MAILPIT_API_URL}/api/v1/messages`)
    .delete()
    .send()
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
        Subject: String
      }[]
    }
  >()
    .url(`${apiEnv.MAILPIT_API_URL}/api/v1/messages`)
    .get()
    .send()

  return data
}

export const getMailpitMessageSource = async (messageId: string) => {
  const { data } = await makeHttpClient<object, string>()
    .url(`${apiEnv.MAILPIT_API_URL}/api/v1/message/${messageId}/raw`)
    .asText()
    .get()
    .send()
  const source = await simpleParser(data as string)

  const $ = cheerio.load(source.html as string)
  return { data, source, $ }
}
