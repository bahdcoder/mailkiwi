import type { JSONContent } from '@tiptap/core'

import { BroadcastRepository } from '@/broadcasts/repositories/broadcast_repository.js'

import type { BroadcastWithEmailContent } from '@/database/database_schema_types.js'

import { container } from '@/utils/typi.js'

interface ValidationResult {
  url: string
  isValid: boolean
  error?: string
}

export class ValidateBroadcastEmailContentAction {
  private readonly TIMEOUT = 5000
  private readonly CONCURRENT_REQUESTS = 10

  constructor(
    private broadcastRepository: BroadcastRepository = container.make(
      BroadcastRepository,
    ),
  ) {}

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

    // Validate links and images concurrently
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
