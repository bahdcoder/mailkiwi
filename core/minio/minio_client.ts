import type { Readable } from 'node:stream'
import { appEnv } from '#root/core/app/env/app_env.js'
import { Client } from 'minio'

import { container } from '#root/core/utils/typi.js'

type BucketName = 'contacts' | 'attachments' | 'emails' | 'media'

export class MinioClient {
  private client = new Client({
    useSSL: appEnv.isProduction,
    endPoint: appEnv.FILE_UPLOADS_ENDPOINT,
    port: appEnv.FILE_UPLOADS_PORT,
    accessKey: appEnv.FILE_UPLOADS_ACCESS_KEY,
    secretKey: appEnv.FILE_UPLOADS_ACCESS_SECRET,
  })

  private bucketName: string
  private objectName: string
  private itemMetadata: Record<string, string>

  bucket(name: BucketName) {
    this.bucketName = name

    return this
  }

  name(objectName: string) {
    this.objectName = objectName

    return this
  }

  private async ensureBucketExists() {
    const exists = await this.client.bucketExists(this.bucketName)

    if (!exists) {
      await this.client.makeBucket(this.bucketName)
    }
  }

  metadata(itemMetadata: Record<string, string>) {
    this.itemMetadata = itemMetadata

    return this
  }

  async write(stream: Readable) {
    await this.ensureBucketExists()

    await this.client.putObject(
      this.bucketName,
      this.objectName,
      stream,
      undefined,
      this.itemMetadata ?? undefined,
    )

    return {
      url: `/${this.bucketName}/${this.objectName}`,
    }
  }

  getFullPath() {
    return new URL(
      `${appEnv.FILE_UPLOADS_ENDPOINT}:${appEnv.FILE_UPLOADS_PORT}/${this.bucketName}/${this.objectName}`,
    ).toString()
  }

  async read() {
    return this.client.getObject(this.bucketName, this.objectName)
  }

  async presignedUrl(expiresIn?: number) {
    return this.client.presignedGetObject(this.bucketName, this.objectName, expiresIn)
  }
}

export function makeMinioClient() {
  return container.make(MinioClient)
}
