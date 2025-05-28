import { Readable } from 'node:stream'
import { makeS3Client } from '#root/core/minio/s3_client.js'
import mime from 'mime-types'

import { cuid } from '#root/core/shared/utils/cuid/cuid.js'

export class AddMediaDocumentAction {
  handle = async (file: File, teamId: string) => {
    const fileIdentifier = cuid()
    const extension = mime.extension(file.type) as string

    const fileKey = `${teamId}/media/${fileIdentifier}.${extension}`

    const writeOptions =  {
      ACL: 'public-read' as const,
      ContentType: `${mime.contentType(file.type)}`,
    }

    const url = await makeS3Client().putObject(
      fileKey,
      Readable.from(file.stream() as unknown as NodeJS.ReadableStream),
      writeOptions
    )

    return { url }
  }
}
