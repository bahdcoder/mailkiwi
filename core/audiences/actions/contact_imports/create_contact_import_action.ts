import { Readable } from 'node:stream'
import { makeMinioClient } from '#root/core/minio/minio_client.js'
import { makeS3Client } from '#root/core/minio/s3_client.js'
import mime from 'mime-types'

import { ContactImportRepository } from '#root/core/audiences/repositories/contact_import_repository.js'

import { readHeadersAndRowsFromCsvStream } from '#root/core/shared/utils/csv/read_headers_and_rows_from_csv_stream.js'
import { cuid } from '#root/core/shared/utils/cuid/cuid.js'

import { container } from '#root/core/utils/typi.js'

type HeaderMap = {
  email: string
  firstName: string
  lastName: string
  customProperties: string[]
  headers: string[]
  tags: string[]
  tagIds: string[]
}

type FieldType = keyof Omit<HeaderMap, 'customProperties' | 'headers' | 'tags' | 'tagIds'>

export class CreateContactImportAction {
  constructor(
    private contactImportRepository = container.make(ContactImportRepository),
  ) {}

  handle = async (file: File, audienceId: string, teamId: string) => {
    const fileIdentifier = cuid()

    const extension = mime.extension(file.type) || 'csv'

    const fileKey = ContactImportRepository.getUploadedFileKey(
      fileIdentifier,
      extension,
      teamId,
    )

    const storage = makeS3Client()

    await storage.putObject(
      fileKey,
      Readable.from(file.stream() as unknown as NodeJS.ReadableStream),
      {
        ACL: 'private',
        ContentType: `${mime.contentType(file.type)}`,
      },
    )

    const stream = await storage.getObjectStream(fileKey)

    const { headers, headerCounts, headerSamples } =
      await this.readHeadersAndFirstNRows(stream)

    const { customProperties, ...propertiesMap } = this.mapCsvHeaders(headers)

    const { id } = await this.contactImportRepository.create({
      audienceId,
      status: 'PENDING',
      id: fileIdentifier,
      propertiesMap: {
        ...propertiesMap,
        customPropertiesHeaders: customProperties,
      },
    })

    return {
      id,
      extension,
      headerCounts,
      headerSamples,
      propertiesMap: {
        ...propertiesMap,
        customPropertiesHeaders: customProperties,
      },
    }
  }

  private async readHeadersAndFirstNRows(
    stream: Readable,
    n = 3,
  ): Promise<{
    headers: string[]
    headerCounts: Record<string, number>
    headerSamples: Record<string, string[]>
  }> {
    const { headers, rows } = await readHeadersAndRowsFromCsvStream(stream)

    const headerCounts: Record<string, number> = {}
    const headerSamples: Record<string, string[]> = {}

    for (const row of rows) {
      for (const header of headers) {
        headerCounts[header] = headerCounts[header] ?? 0
        headerSamples[header] = headerSamples[header] ?? []

        if (row[header]) {
          headerCounts[header]++

          if (headerSamples[header].length < 5) {
            headerSamples[header].push(String(row[header]))
          }
        }
      }
    }

    return { headers, headerCounts, headerSamples }
  }

  private mapCsvHeaders(headers: string[]): HeaderMap {
    const csvToContactAttributes: HeaderMap = {
      email: '',
      firstName: '',
      lastName: '',
      customProperties: [],
      tags: [],
      tagIds: [],
      headers,
    }

    const fieldPatterns: Record<FieldType, RegExp> = {
      email: /^(?:e[-_]?mail|email[-_]?address)$/i,
      firstName: /^(?:f(?:irst)?[-_\s]?name|given[-_\s]?name|forename|fname)$/i,
      lastName: /^(?:l(?:ast)?[-_\s]?name|surname|family[-_\s]?name|lname)$/i,
    }
    for (const header of headers) {
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
        csvToContactAttributes.customProperties.push(header)
      }
    }

    return csvToContactAttributes
  }
}
