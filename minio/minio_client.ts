import { apiEnv } from "@/api/env/api_env.js"
import { Client } from "minio"
import { Readable } from "stream"

import { container } from "@/utils/typi.js"

type BucketName = "contacts" | "attachments" | "emails"

export class MinioClient {
  private client = new Client({
    useSSL: apiEnv.isProduction,
    endPoint: apiEnv.FILE_UPLOADS_ENDPOINT,
    port: apiEnv.FILE_UPLOADS_PORT,
    accessKey: apiEnv.FILE_UPLOADS_ACCESS_KEY,
    secretKey: apiEnv.FILE_UPLOADS_ACCESS_SECRET,
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

  async read() {
    return this.client.getObject(this.bucketName, this.objectName)
  }

  async presignedUrl(expiresIn?: number) {
    return this.client.presignedGetObject(
      this.bucketName,
      this.objectName,
      expiresIn,
    )
  }
}

export function makeMinioClient() {
  return container.make(MinioClient)
}
