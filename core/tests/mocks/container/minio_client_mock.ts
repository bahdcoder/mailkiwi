import { Readable, Stream } from 'node:stream'
import { vi } from 'vitest'

export class FakeMinioClient {
  public bucketName = ''
  public objectName = ''
  public itemMetadata: Record<string, string> = {}

  public stream: Readable

  public bucketExists = vi.fn().mockResolvedValue(true)
  public makeBucket = vi.fn().mockResolvedValue(undefined)
  public putObject = vi.fn().mockResolvedValue({ etag: 'fake-etag' })
  public getObject = vi.fn().mockResolvedValue(Readable.from('fake data'))
  public presignedGetObject = vi.fn().mockResolvedValue('http://fake-presigned-url.com')

  bucket(name: string) {
    this.bucketName = name
    return this
  }

  name(objectName: string) {
    this.objectName = objectName
    return this
  }

  metadata(itemMetadata: Record<string, string>) {
    this.itemMetadata = itemMetadata
    return this
  }

  async write(stream: Readable) {
    this.stream = stream

    await this.ensureBucketExists()

    await this.putObject(
      this.bucketName,
      this.objectName,
      stream,
      undefined,
      this.itemMetadata,
    )
    return { url: `/${this.bucketName}/${this.objectName}` }
  }

  async read() {
    return this.getObject(this.bucketName, this.objectName)
  }

  async presignedUrl(expiresIn?: number) {
    return this.presignedGetObject(this.bucketName, this.objectName, expiresIn)
  }

  private async ensureBucketExists() {
    const exists = await this.bucketExists(this.bucketName)
    if (!exists) {
      await this.makeBucket(this.bucketName)
    }
  }
}
