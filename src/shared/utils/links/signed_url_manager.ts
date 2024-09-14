import crypto from "node:crypto"

import { makeEnv } from "@/shared/container/index.js"

export interface UrlMetadata {
  [key: string]: string | undefined
}

export class SignedUrlManager {
  constructor(private env = makeEnv()) {}

  encode(original: string, metadata?: UrlMetadata): string {
    const nonce = crypto.randomBytes(4).toString("hex")

    const data = JSON.stringify({
      original,
      metadata: metadata ?? {},
      nonce,
      timestamp: Date.now(),
    })

    const hash = crypto
      .createHmac("sha256", this.env.APP_KEY.release())
      .update(data)
      .digest("base64url")
      .slice(0, 16)

    const encoded = Buffer.from(data).toString("base64url")

    return `${hash}.${encoded}`
  }

  decode(encoded: string): {
    original: string
    metadata?: UrlMetadata
  } | null {
    const [hash, data] = encoded.split(".")

    if (!hash || !data) {
      return null
    }

    const decodedData = Buffer.from(data, "base64url").toString()

    const computedHash = crypto
      .createHmac("sha256", this.env.APP_KEY.release())
      .update(decodedData)
      .digest("base64url")
      .slice(0, 16)

    if (computedHash !== hash) {
      return null
    }

    try {
      const parsed = JSON.parse(decodedData)

      return {
        original: parsed?.original,
        metadata: parsed?.metadata,
      }
    } catch (error) {
      return null
    }
  }
}
