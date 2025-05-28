import crypto from 'node:crypto'
import { appEnv } from '#root/core/app/env/app_env.js'

export interface LinkMetadata {
  broadcastId?: string
  abTestVariantId?: string
  [key: string]: string | undefined
}

export class EmailLinkManager {
  constructor(private env = appEnv) {}

  encodeLink(originalLink: string, metadata: LinkMetadata): string {
    const nonce = crypto.randomBytes(4).toString('hex')

    const data = JSON.stringify({
      link: originalLink,
      metadata,
      nonce,
      timestamp: Date.now(),
    })

    const hash = crypto
      .createHmac('sha256', this.env.APP_KEY)
      .update(data)
      .digest('base64url')
      .slice(0, 10)

    const encodedData = Buffer.from(data).toString('base64url')

    return `${hash}.${encodedData}`
  }

  decodeLink(
    encodedLink: string,
  ): { originalLink: string; metadata: LinkMetadata } | null {
    const [receivedHash, encodedData] = encodedLink.split('.')

    if (!receivedHash || !encodedData) {
      return null
    }

    const decodedData = Buffer.from(encodedData, 'base64url').toString()

    const computedHash = crypto
      .createHmac('sha256', this.env.APP_KEY)
      .update(decodedData)
      .digest('base64url')
      .slice(0, 10)

    if (computedHash !== receivedHash) {
      return null
    }

    const parsedData = JSON.parse(decodedData)

    return {
      originalLink: parsedData.link,
      metadata: parsedData.metadata,
    }
  }
}
