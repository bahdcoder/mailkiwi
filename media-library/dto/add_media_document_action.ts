import { makeMinioClient } from "@/minio/minio_client.js"
import mime from "mime-types"
import { Readable } from "stream"

import { cuid } from "@/shared/utils/cuid/cuid.js"

export class AddMediaDocumentAction {
  handle = async (file: File) => {
    const fileIdentifier = cuid()

    const extension = mime.extension(file.type) as string

    const minio = makeMinioClient()
      .bucket("media")
      .name(`${fileIdentifier}.${extension}`)
      .metadata({
        acl: "public-read",
        "Content-Type": mime.contentType(file.type) as string,
      })

    // @ts-ignore
    const { url } = await minio.write(Readable.from(file.stream()))

    return { url }
  }
}
