import { describe, test, expect, beforeEach } from 'vitest'
import {
  EmailLinkManager,
  type LinkMetadata,
} from '@/shared/utils/links/link_manager.js'
import { EnvVariables } from '@/shared/env/index.ts'
import { Secret } from '@poppinss/utils'

describe('Link manager ', () => {
  let linkManager: EmailLinkManager

  beforeEach(() => {
    linkManager = new EmailLinkManager({
      APP_KEY: new Secret('test_app_key'),
    } as EnvVariables)
  })

  test('encodeLink should generate a valid encoded link', () => {
    const originalLink = 'https://example.com'
    const metadata: LinkMetadata = {
      broadcastId: '123',
      abTestVariantId: 'abc',
    }
    const encodedLink = linkManager.encodeLink(originalLink, metadata)

    expect(encodedLink).toMatch(/^[A-Za-z0-9_-]{10}\.[A-Za-z0-9_-]+$/)
  })

  test('decodeLink should correctly decode a valid encoded link', () => {
    const originalLink = 'https://example.com'
    const metadata: LinkMetadata = {
      broadcastId: '123',
      abTestVariantId: 'abc',
    }
    const encodedLink = linkManager.encodeLink(originalLink, metadata)
    const decodedData = linkManager.decodeLink(encodedLink)

    expect(decodedData).not.toBeNull()
    expect(decodedData?.originalLink).toBe(originalLink)
    expect(decodedData?.metadata).toEqual(metadata)
  })

  test('decodeLink should return null for an invalid encoded link', () => {
    const invalidLink = 'invalid.encodedlink'
    const decodedData = linkManager.decodeLink(invalidLink)

    expect(decodedData).toBeNull()
  })

  test('decodeLink should return null for a tampered encoded link', () => {
    const originalLink = 'https://example.com'
    const metadata: LinkMetadata = { broadcastId: '123' }
    const encodedLink = linkManager.encodeLink(originalLink, metadata)
    const tamperedLink = `x${encodedLink.slice(1)}`
    const decodedData = linkManager.decodeLink(tamperedLink)

    expect(decodedData).toBeNull()
  })

  test('encodeLink should handle empty metadata', () => {
    const originalLink = 'https://example.com'
    const metadata: LinkMetadata = {}
    const encodedLink = linkManager.encodeLink(originalLink, metadata)
    const decodedData = linkManager.decodeLink(encodedLink)

    expect(decodedData).not.toBeNull()
    expect(decodedData?.originalLink).toBe(originalLink)
    expect(decodedData?.metadata).toEqual(metadata)
  })

  test('encodeLink should handle long URLs and complex metadata', () => {
    const originalLink =
      'https://example.com/very/long/url/with/many/parameters?param1=value1&param2=value2'
    const metadata: LinkMetadata = {
      broadcastId: '123456789',
      abTestVariantId: 'abcdefghijk',
      customField1: 'longvalue1234567890',
      customField2: 'anotherlongvalue0987654321',
    }
    const encodedLink = linkManager.encodeLink(originalLink, metadata)
    const decodedData = linkManager.decodeLink(encodedLink)

    expect(decodedData).not.toBeNull()
    expect(decodedData?.originalLink).toBe(originalLink)
    expect(decodedData?.metadata).toEqual(metadata)
  })

  test('decodeLink should handle encoded links with special characters', () => {
    const originalLink =
      'https://example.com/path?query=special chars!@#$%^&*()'
    const metadata: LinkMetadata = { special: '!@#$%^&*()' }
    const encodedLink = linkManager.encodeLink(originalLink, metadata)
    const decodedData = linkManager.decodeLink(encodedLink)

    expect(decodedData).not.toBeNull()
    expect(decodedData?.originalLink).toBe(originalLink)
    expect(decodedData?.metadata).toEqual(metadata)
  })
})
