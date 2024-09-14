import { makeMinioClient } from "@/minio/minio_client.ts"
import CsvParser from "csv-parser"
import mime from "mime-types"
import { Readable } from "stream"

import { ContactImportRepository } from "@/audiences/repositories/contact_import_repository.ts"

import { cuid } from "@/shared/utils/cuid/cuid.ts"

import { container } from "@/utils/typi.js"

type HeaderMap = {
  email: string
  firstName: string
  lastName: string
  attributes: string[]
  headers: string[]
  tags: string[]
  tagIds: number[]
}

type FieldType = keyof Omit<
  HeaderMap,
  "attributes" | "headers" | "tags" | "tagIds"
>

export class CreateContactImportAction {
  constructor(
    private contactImportRepository = container.make(
      ContactImportRepository,
    ),
  ) {}

  handle = async (file: File, audienceId: number) => {
    const fileIdentifier = cuid()

    const extension = mime.extension(file.type) ?? "csv"

    const minio = makeMinioClient()
      .bucket("contacts")
      .name(`${fileIdentifier}.${extension}`)

    const { url } = await minio.write(Readable.from(file.stream()))

    const stream = await minio.read()

    const headers = await this.readHeadersAndFirstNRows(stream)

    const { id } = await this.contactImportRepository.create({
      uploadUrl: url,
      audienceId,
      status: "PENDING",
      fileIdentifier,
      attributesMap: this.mapCsvHeaders(headers),
    })

    return { id, extension }
  }

  private async readHeadersAndFirstNRows(
    stream: Readable,
    n = 3,
  ): Promise<string[]> {
    const parser = stream.pipe(CsvParser())

    return new Promise(function (resolve, reject) {
      parser.on("headers", resolve)
      parser.on("error", reject)
    })
  }

  private mapCsvHeaders(headers: string[]): HeaderMap {
    const csvToContactAttributes: HeaderMap = {
      email: "",
      firstName: "",
      lastName: "",
      attributes: [],
      tags: [],
      tagIds: [],
      headers,
    }

    const fieldPatterns: Record<FieldType, RegExp> = {
      email: /^(?:e[-_]?mail|email[-_]?address)$/i,
      firstName:
        /^(?:f(?:irst)?[-_\s]?name|given[-_\s]?name|forename|fname)$/i,
      lastName:
        /^(?:l(?:ast)?[-_\s]?name|surname|family[-_\s]?name|lname)$/i,
    }
    headers.forEach((header) => {
      const normalizedHeader = header.trim()
      let matched = false

      for (const [fieldType, pattern] of Object.entries(fieldPatterns)) {
        if (pattern.test(normalizedHeader)) {
          csvToContactAttributes[fieldType as FieldType] = header
          matched = true
          break
        }
      }

      if (!matched) {
        csvToContactAttributes.attributes.push(header)
      }
    })

    return csvToContactAttributes
  }
}
