import crypto from 'node:crypto'
import type { Secret } from '@poppinss/utils'

export interface UrlMetadata {
  [key: string]: string | undefined
}

export interface DecodedSignature {
  original: string
  metadata?: UrlMetadata
}

/**
 * SignedUrlManager handles cryptographic signing and verification of tracking URLs.
 *
 * This class is a critical security component of Kibamail's email tracking system, responsible for:
 * 1. Creating cryptographically signed URLs for email tracking
 * 2. Verifying the authenticity of tracking URLs when clicked
 * 3. Securely embedding metadata in tracking URLs
 * 4. Preventing tampering with redirect destinations
 *
 * The implementation uses HMAC-SHA256 signatures to ensure that tracking URLs cannot be
 * forged or modified by third parties. This prevents security issues like open redirects
 * and ensures that tracking data is accurate and trustworthy.
 *
 * The URL format uses a compact base64url encoding with a structure of:
 * hash.payload
 * where:
 * - hash is a truncated HMAC-SHA256 signature of the payload
 * - payload contains the original URL and any metadata in base64url-encoded JSON
 */
export class SignedUrlManager {
  /**
   * Length of the HMAC hash used for URL signatures.
   * This value balances security (longer is more secure) with URL length constraints.
   * 16 characters provides sufficient security while keeping URLs reasonably short.
   */
  protected HASH_LENGTH = 16

  constructor(private appKey: Secret<string>) {}

  /**
   * Creates a cryptographically signed URL for tracking.
   *
   * This method implements the URL signing process:
   * 1. Combines the original URL and metadata into a JSON structure
   * 2. Computes an HMAC-SHA256 signature of the JSON data
   * 3. Encodes the JSON data as base64url
   * 4. Returns the signature and encoded data as a compact string
   *
   * The resulting signed URL can be safely included in emails and will be
   * verified when clicked to ensure it hasn't been tampered with.
   *
   * @param original - The original URL or data to encode
   * @param metadata - Optional metadata to include with the URL
   * @returns A cryptographically signed string in the format "hash.payload"
   */
  encode(original: string, metadata?: UrlMetadata): string {
    // Create a JSON structure containing the original URL and any metadata
    const data = JSON.stringify({
      o: original, // 'o' for original URL/data
      ...(metadata ? { m: metadata } : {}), // 'm' for metadata if provided
    })

    // Compute an HMAC-SHA256 signature of the JSON data
    // This signature will be used to verify the URL hasn't been tampered with
    const hash = crypto
      .createHmac('sha256', this.appKey.release())
      .update(data)
      .digest('base64url')
      .slice(0, this.HASH_LENGTH) // Truncate to keep URLs shorter

    // Encode the JSON data as base64url for compact representation
    const encoded = Buffer.from(data).toString('base64url')

    // Combine the signature and encoded data
    return `${hash}.${encoded}`
  }

  /**
   * Verifies and decodes a cryptographically signed URL.
   *
   * This method implements the URL verification process:
   * 1. Splits the input into hash and data components
   * 2. Decodes the base64url-encoded data
   * 3. Recomputes the HMAC-SHA256 signature
   * 4. Verifies that the provided hash matches the computed hash
   * 5. Parses the JSON data to extract the original URL and metadata
   *
   * This verification ensures that the URL hasn't been tampered with and
   * that the redirect destination is the one originally intended.
   *
   * @param encoded - The signed URL string in the format "hash.payload"
   * @returns The original URL and metadata if verification succeeds, null otherwise
   */
  decode(encoded: string): {
    original: string
    metadata?: UrlMetadata
  } | null {
    // Split the input into hash and data components
    const [hash, data] = encoded.split('.')

    // Validate that both components are present
    if (!hash || !data) {
      return null
    }

    // Decode the base64url-encoded data
    const decodedData = Buffer.from(data, 'base64url').toString()

    // Recompute the HMAC-SHA256 signature for verification
    const computedHash = crypto
      .createHmac('sha256', this.appKey.release())
      .update(decodedData)
      .digest('base64url')
      .slice(0, this.HASH_LENGTH)

    // Verify that the provided hash matches the computed hash
    // If they don't match, the URL has been tampered with
    if (computedHash !== hash) {
      return null
    }

    try {
      // Parse the JSON data to extract the original URL and metadata
      const parsed = JSON.parse(decodedData)

      return {
        original: parsed?.o, // Original URL/data
        metadata: parsed?.m, // Associated metadata
      }
    } catch (error) {
      // If JSON parsing fails, the data is invalid
      return null
    }
  }
}
