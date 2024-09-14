import { Client } from "minio"
import { Readable } from "stream"

import { makeEnv } from "@/shared/container/index.ts"

import { container } from "@/utils/typi.ts"

type BucketName = "contacts" | "attachments" | "emails"

export class MinioClient {
  private client = new Client({
    useSSL: this.env.isProd,
    endPoint: this.env.FILE_UPLOADS_ENDPOINT,
    port: parseInt(this.env.FILE_UPLOADS_PORT),
    accessKey: this.env.FILE_UPLOADS_ACCESS_KEY,
    secretKey: this.env.FILE_UPLOADS_ACCESS_SECRET,
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

  constructor(private env = makeEnv()) {}

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
