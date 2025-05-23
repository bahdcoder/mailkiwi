import type { Readable } from 'node:stream'
import { appEnv } from '#root/core/app/env/app_env.js'
import {
  GetObjectCommand,
  type PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { container } from '#root/core/utils/typi.js'
import { assetsPath } from '#root/pages/utils/assets_path.js'

export class S3Disk {
  protected client = new S3Client({
    credentials: {
      accessKeyId: appEnv.FILE_UPLOADS_ACCESS_KEY,
      secretAccessKey: appEnv.FILE_UPLOADS_ACCESS_SECRET,
    },
    region: appEnv.FILE_UPLOADS_REGION,
    endpoint: appEnv.FILE_UPLOADS_ENDPOINT,
  })

  async getSignedUrl(Key: string, expiresIn?: number) {
    const command = new GetObjectCommand({
      Bucket: appEnv.FILE_UPLOADS_BUCKET,
      Key,
    })

    return getSignedUrl(this.client, command, {
      expiresIn,
    })
  }

  async getObjectStream(Key: string) {
    const command = new GetObjectCommand({
      Bucket: appEnv.FILE_UPLOADS_BUCKET,
      Key,
    })

    const result = await this.client.send(command)

    return result.Body as Readable
  }

  async putObject(
    Key: string,
    data: string | Readable,
    writeOptions?: Partial<PutObjectCommandInput>,
  ) {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: appEnv.FILE_UPLOADS_BUCKET,
        Key,
        Body: data,
        ...writeOptions,
      },
    })

    await upload.done()

    return assetsPath(Key)
  }
}

export function makeS3Client() {
  return container.make(S3Disk)
}
