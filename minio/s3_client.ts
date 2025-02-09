import { appEnv } from "@/app/env/app_env.js"
import { PutObjectCommandInput, S3Client } from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"
import { Readable } from "stream"

import { container } from "@/utils/typi.js"

export class S3Disk {
  protected client = new S3Client({
    credentials: {
      accessKeyId: appEnv.FILE_UPLOADS_ACCESS_KEY,
      secretAccessKey: appEnv.FILE_UPLOADS_ACCESS_SECRET,
    },
    region: appEnv.FILE_UPLOADS_REGION,
    endpoint: `https://${appEnv.FILE_UPLOADS_ENDPOINT}`,
  })

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

    const url = `https://${appEnv.FILE_UPLOADS_BUCKET}.${appEnv.FILE_UPLOADS_ENDPOINT}/${Key}`

    return url
  }
}

export function makeS3Client() {
  return container.make(S3Disk)
}
