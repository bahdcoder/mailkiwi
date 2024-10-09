import { Secret } from "@poppinss/utils"
import crypto from "node:crypto"

export interface UrlMetadata {
  [key: string]: string | undefined
}

export class SignedUrlManager {
  protected HASH_LENGTH = 16
  constructor(private appKey: Secret<string>) {}

  encode(original: string, metadata?: UrlMetadata): string {
    const data = JSON.stringify({
      o: original,
      ...(metadata ? { m: metadata } : {}),
    })

    const hash = crypto
      .createHmac("sha256", this.appKey.release())
      .update(data)
      .digest("base64url")
      .slice(0, this.HASH_LENGTH)

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
      .createHmac("sha256", this.appKey.release())
      .update(decodedData)
      .digest("base64url")
      .slice(0, this.HASH_LENGTH)

    if (computedHash !== hash) {
      return null
    }

    try {
      const parsed = JSON.parse(decodedData)

      return {
        original: parsed?.o,
        metadata: parsed?.m,
      }
    } catch (error) {
      return null
    }
  }
}
