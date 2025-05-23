import type { JSONContent } from '@tiptap/core'

import { BroadcastRepository } from '#root/core/broadcasts/repositories/broadcast_repository.js'

import type { BroadcastWithEmailContent } from '#root/database/database_schema_types.js'

import { container } from '#root/core/utils/typi.js'

interface ValidationResult {
  url: string
  isValid: boolean
  error?: string
}

/**
 * ValidateBroadcastEmailContentAction validates links and images in broadcast email content.
 *
 * This action is responsible for ensuring that all external resources referenced in an
 * email broadcast are valid and accessible before the broadcast is sent. It:
 *
 * 1. Extracts all links and image URLs from the email content
 * 2. Validates each URL by making HTTP requests to check accessibility
 * 3. Verifies that image URLs actually point to valid image resources
 *
 * This validation is critical for maintaining email quality and preventing broken
 * links or missing images that would negatively impact recipient experience and
 * potentially harm sender reputation.
 */
export class ValidateBroadcastEmailContentAction {
  private readonly TIMEOUT = 5000
  private readonly CONCURRENT_REQUESTS = 10

  constructor(
    private broadcastRepository: BroadcastRepository = container.make(
      BroadcastRepository,
    ),
  ) {}

  /**
   * Validates a URL by making an HTTP GET request to check if it's accessible.
   *
   * Uses a timeout to prevent hanging on slow or unresponsive endpoints.
   *
   * @param url - The URL to validate
   * @returns ValidationResult with status and any error information
   */
  private async validateUrl(url: string): Promise<ValidationResult> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.TIMEOUT)

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
      })

      return {
        url,
        isValid: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      }
    } catch (error) {
      return {
        url,
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Validates an image URL by checking both accessibility and content type.
   *
   * Uses a HEAD request to efficiently check if the URL:
   * 1. Is accessible (returns a successful HTTP status)
   * 2. Actually points to an image resource (has image/* content type)
   *
   * @param imageUrl - The image URL to validate
   * @returns ValidationResult with status and any error information
   */
  private async validateImage(imageUrl: string): Promise<ValidationResult> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.TIMEOUT)

    try {
      const response = await fetch(imageUrl, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
      })

      if (!response.ok) {
        return {
          url: imageUrl,
          isValid: false,
          error: `HTTP ${response.status}`,
        }
      }

      const contentType = response.headers.get('content-type')
      const isImage = contentType?.startsWith('image/')

      return {
        url: imageUrl,
        isValid: isImage === true,
        error: isImage ? undefined : 'Not an image',
      }
    } catch (error) {
      return {
        url: imageUrl,
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Processes a list of items in batches to prevent overwhelming external services.
   *
   * This utility method enables controlled concurrency when making multiple HTTP requests,
   * which helps to:
   * - Prevent rate limiting from external services
   * - Manage memory usage for large lists
   * - Provide better error isolation between batches
   *
   * @param items - List of items to process
   * @param processor - Function to process each item
   * @param batchSize - Maximum number of concurrent operations
   * @returns Combined results from all batches
   */
  private async batchProcess<T>(
    items: string[],
    processor: (item: string) => Promise<T>,
    batchSize: number,
  ): Promise<T[]> {
    const results: T[] = []

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch.map((item) => processor(item)))
      results.push(...batchResults)
    }

    return results
  }

  /**
   * Validates all links and images in a broadcast's email content.
   *
   * This method:
   * 1. Extracts all links and image URLs from the email content
   * 2. Filters out template variables (links containing {{ }})
   * 3. Validates all external resources in parallel with controlled concurrency
   *
   * @param broadcast - The broadcast with email content to validate
   * @returns Object containing validation results for links and images
   */
  async handle(broadcast: BroadcastWithEmailContent) {
    const emailContent = broadcast.emailContent?.contentJson as JSONContent

    const links: string[] = []
    const images: string[] = []

    const findLinksAndImages = (content: JSONContent) => {
      if (content.content) {
        for (const child of content.content) {
          if (child.type === 'imageBlock') {
            images.push(child.attrs?.src)
          }

          if (child.type === 'button') {
            links.push(child.attrs?.href)
          }

          if (child.marks) {
            for (const mark of child.marks) {
              if (mark.type === 'link') {
                links.push(mark.attrs?.href as string)
              }
            }
          }

          if (child.content) {
            findLinksAndImages(child)
          }
        }
      }
    }

    findLinksAndImages(emailContent)

    const nonInternalLinks = links.filter(
      (link) => !(link.includes('{{') && link.includes('}}')),
    )

    const [linkResults, imageResults] = await Promise.all([
      this.batchProcess(
        nonInternalLinks,
        (url) => this.validateUrl(url),
        this.CONCURRENT_REQUESTS,
      ),
      this.batchProcess(
        images,
        (url) => this.validateImage(url),
        this.CONCURRENT_REQUESTS,
      ),
    ])

    return {
      links: linkResults,
      images: imageResults,
    }
  }
}
