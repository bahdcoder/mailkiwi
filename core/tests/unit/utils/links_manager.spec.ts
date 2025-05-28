import { Secret } from '@poppinss/utils'
import { beforeEach, describe, expect, test } from 'vitest'

import {
  SignedUrlManager,
  type UrlMetadata,
} from '#root/core/shared/utils/links/signed_url_manager.js'

describe('@link-manager Link manager ', () => {
  let linkManager: SignedUrlManager

  beforeEach(() => {
    linkManager = new SignedUrlManager(new Secret('test_app_key'))
  })

  test('encode should generate a valid encoded link', () => {
    const original = 'https://example.com'
    const metadata: UrlMetadata = {
      broadcastId: '123',
      abTestVariantId: 'abc',
    }
    const encodedLink = linkManager.encode(original, metadata)

    expect(encodedLink).toMatch(/^[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+$/)
  })

  test('decode should correctly decode a valid encoded link', () => {
    const original = 'https://example.com?query=param'
    const metadata: UrlMetadata = {
      broadcastId: '123',
      abTestVariantId: 'abc',
    }
    const encodedLink = linkManager.encode(original, metadata)
    const decodedData = linkManager.decode(encodedLink)

    expect(decodedData).not.toBeNull()
    expect(decodedData?.original).toBe(original)
    expect(decodedData?.metadata).toEqual(metadata)
  })

  test('decode should return null for an invalid encoded link', () => {
    const invalidLink = 'invalid.encodedlink'
    const decodedData = linkManager.decode(invalidLink)

    expect(decodedData).toBeNull()
  })

  test('decode should return null for a tampered encoded link', () => {
    const original = 'https://example.com'
    const metadata: UrlMetadata = { broadcastId: '123' }
    const encodedLink = linkManager.encode(original, metadata)
    const tamperedLink = `x${encodedLink.slice(1)}`
    const decodedData = linkManager.decode(tamperedLink)

    expect(decodedData).toBeNull()
  })

  test('encode should handle empty metadata', () => {
    const original = 'https://example.com'
    const metadata: UrlMetadata = {}
    const encodedLink = linkManager.encode(original, metadata)
    const decodedData = linkManager.decode(encodedLink)

    expect(decodedData).not.toBeNull()
    expect(decodedData?.original).toBe(original)
    expect(decodedData?.metadata).toEqual(metadata)
  })

  test('encode should handle long URLs and complex metadata', () => {
    const original =
      'https://example.com/very/long/url/with/many/parameters?param1=value1&param2=value2'
    const metadata: UrlMetadata = {
      broadcastId: '123456789',
      abTestVariantId: 'abcdefghijk',
      customField1: 'longvalue1234567890',
      customField2: 'anotherlongvalue0987654321',
    }
    const encodedLink = linkManager.encode(original, metadata)
    const decodedData = linkManager.decode(encodedLink)

    expect(decodedData).not.toBeNull()
    expect(decodedData?.original).toBe(original)
    expect(decodedData?.metadata).toEqual(metadata)
  })

  test('decode should handle encoded links with special characters', () => {
    const original = 'https://example.com/path?query=special chars!@#$%^&*()'
    const metadata: UrlMetadata = { special: '!@#$%^&*()' }
    const encodedLink = linkManager.encode(original, metadata)
    const decodedData = linkManager.decode(encodedLink)

    expect(decodedData).not.toBeNull()
    expect(decodedData?.original).toBe(original)
    expect(decodedData?.metadata).toEqual(metadata)
  })
})
