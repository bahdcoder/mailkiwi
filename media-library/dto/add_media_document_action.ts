import { makeMinioClient } from "@/minio/minio_client.js"
import { makeS3Client } from "@/minio/s3_client.js"
import mime from "mime-types"
import { Readable } from "stream"

import { cuid } from "@/shared/utils/cuid/cuid.js"

export class AddMediaDocumentAction {
  handle = async (file: File, teamId: string) => {
    const fileIdentifier = cuid()
    const extension = mime.extension(file.type) as string

    const fileKey = `${teamId}/media/${fileIdentifier}.${extension}`

    const url = await makeS3Client().putObject(
      fileKey,
      Readable.from(file.stream() as any),
      {
        ACL: "public-read",
        ContentType: `${mime.contentType(file.type)}`,
      },
    )

    return { url }
  }
}
