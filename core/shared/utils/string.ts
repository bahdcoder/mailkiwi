import { randomBytes } from 'node:crypto'
import type { Readable } from 'node:stream'
import { base64 } from '@poppinss/utils'
import { v1, v4 } from 'uuid'

export function fromEmailToDomain(email: string) {
  return email?.split('@')?.[1]
}

export function generateMessageIdForDomain(domain: string) {
  const id = v1()
  return { id, messageId: `<${`${id}@${domain}`}>` }
}

export function ipv4AdressFromIpAndPort(ipAndPort: string) {
  return ipAndPort?.split(':')?.[0]
}

export function stringFromReadableStream(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []

    stream.on('data', (chunk) => {
      chunks.push(chunk)
    })

    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))

    stream.on('error', (error) => reject(error))
  })
}

export default {
  fromEmailToDomain,
}
